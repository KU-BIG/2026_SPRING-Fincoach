"""Live quote lookup for user holdings (Korea .KS/.KQ and US tickers) via yfinance.

`get_portfolio_data` uses this to price real user holdings instead of the two-symbol
mock. Failed lookups are simply omitted from the returned dict, so `calculator`
falls back to the average buy price for that symbol (a 0% return — a safe degrade
rather than a wrong number). yfinance is slow and rate-limited, so results are held
in a process-local TTL cache and fetched in parallel.
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

from shared.models import Market, StockData

# ticker -> (StockData, monotonic timestamp). Shared across requests in one process.
_CACHE: dict[str, tuple[StockData, float]] = {}
_TTL_SECONDS = 600  # 10 min — quotes barely move intraday for this use, and it caps yfinance calls.
# Hard cap on distinct tickers held in the cache. The TTL alone only gates reads;
# without an eviction step the dict grows monotonically as new tickers are queried
# (a slow memory leak). On insert we sweep expired entries and, if still over the
# cap, drop the oldest so memory stays bounded.
_MAX_CACHED_TICKERS = 5_000

# Per-symbol network timeout and an overall wall-clock cap for one batch. yfinance has
# no timeout of its own, so a stalled socket would otherwise pin a worker thread forever
# and eventually exhaust FastAPI's thread pool. Timed-out symbols are treated as misses,
# which calculator handles via its avg-price fallback.
_HISTORY_TIMEOUT_SECONDS = 8.0
_BATCH_TIMEOUT_SECONDS = 20.0


def _cache_store(ticker: str, stock: StockData, now: float) -> None:
    """Insert one quote, sweeping expired entries and enforcing the size cap.

    Called on the request thread (results are collected serially), so no lock is
    needed here — the cache is only mutated from this single collection point.
    """
    if len(_CACHE) >= _MAX_CACHED_TICKERS:
        # Drop everything past its TTL first (cheap, keeps hot entries).
        expired = [k for k, (_sd, ts) in _CACHE.items() if now - ts >= _TTL_SECONDS]
        for k in expired:
            del _CACHE[k]
        # If still at the cap (many fresh entries), evict oldest-first until under it.
        if len(_CACHE) >= _MAX_CACHED_TICKERS:
            for k in sorted(_CACHE, key=lambda k: _CACHE[k][1])[
                : len(_CACHE) - _MAX_CACHED_TICKERS + 1
            ]:
                del _CACHE[k]
    _CACHE[ticker] = (stock, now)


def _market_for(ticker: str) -> Market:
    return Market.KR if ticker.endswith((".KS", ".KQ")) else Market.US


def _normalize(ticker: str) -> str:
    """A bare 6-digit Korean code gets the KOSPI (.KS) suffix; suffixed / US tickers pass through."""
    t = ticker.strip().upper()
    if t.isdigit() and len(t) == 6:
        return f"{t}.KS"
    return t


def _fetch_one(ticker: str) -> StockData | None:
    """Fetch the latest close + day-over-day change for one symbol. None on any failure."""
    import yfinance as yf

    norm = _normalize(ticker)
    try:
        hist = yf.Ticker(norm).history(period="5d", timeout=_HISTORY_TIMEOUT_SECONDS)
        closes = hist["Close"].dropna()
        # A KOSPI miss for a 6-digit code may actually be a KOSDAQ symbol — retry with .KQ.
        if len(closes) == 0 and norm.endswith(".KS"):
            norm = norm[:-3] + ".KQ"
            hist = yf.Ticker(norm).history(period="5d", timeout=_HISTORY_TIMEOUT_SECONDS)
            closes = hist["Close"].dropna()
        if len(closes) == 0:
            return None
        close = float(closes.iloc[-1])
        prev = float(closes.iloc[-2]) if len(closes) >= 2 else close
        change_pct = round((close - prev) / prev * 100, 2) if prev else 0.0
        try:
            volume = int(hist["Volume"].dropna().iloc[-1])
        except Exception:
            volume = 0
        # Key the result by the caller's original ticker so calculator's lookup matches.
        return StockData(
            ticker=ticker,
            name=ticker,
            market=_market_for(norm),
            date=date.today(),
            close=close,
            change_pct=change_pct,
            volume=volume,
        )
    except Exception:
        return None


def fetch_stock_data(tickers: list[str]) -> dict[str, StockData]:
    """Return live quotes keyed by the given tickers. Symbols that fail are omitted."""
    now = time.monotonic()
    result: dict[str, StockData] = {}
    to_fetch: list[str] = []
    for t in tickers:
        cached = _CACHE.get(t)
        if cached and now - cached[1] < _TTL_SECONDS:
            result[t] = cached[0]
        elif t and t not in to_fetch:
            to_fetch.append(t)

    if to_fetch:
        pool = ThreadPoolExecutor(max_workers=min(8, len(to_fetch)))
        try:
            # Collect in COMPLETION order, not input order. pool.map yields lazily
            # in submission order, so one slow (near-timeout) leading symbol would
            # withhold every already-finished trailing symbol until the batch
            # deadline, turning them into avoidable misses. as_completed hands us
            # each result the moment it's ready; only symbols that truly don't
            # finish within the batch deadline are left as misses (calculator
            # falls back to their avg price).
            futures = {pool.submit(_fetch_one, t): t for t in to_fetch}
            try:
                for fut in as_completed(futures, timeout=_BATCH_TIMEOUT_SECONDS):
                    ticker = futures[fut]
                    try:
                        stock = fut.result()
                    except Exception:
                        stock = None
                    if stock is not None:
                        _cache_store(ticker, stock, now)
                        result[ticker] = stock
            except TimeoutError:
                # Batch deadline reached — unfinished symbols stay as misses.
                pass
        finally:
            # Don't block the request on threads still stuck in a hung socket; let
            # them finish (or die) in the background instead of joining them here.
            pool.shutdown(wait=False)
    return result
