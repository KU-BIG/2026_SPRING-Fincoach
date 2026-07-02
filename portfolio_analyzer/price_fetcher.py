"""Live quote lookup for user holdings (Korea .KS/.KQ and US tickers) via yfinance.

`get_portfolio_data` uses this to price real user holdings instead of the two-symbol
mock. Failed lookups are simply omitted from the returned dict, so `calculator`
falls back to the average buy price for that symbol (a 0% return — a safe degrade
rather than a wrong number). yfinance is slow and rate-limited, so results are held
in a process-local TTL cache and fetched in parallel.
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date

from shared.models import Market, StockData

# ticker -> (StockData, monotonic timestamp). Shared across requests in one process.
_CACHE: dict[str, tuple[StockData, float]] = {}
_TTL_SECONDS = 600  # 10 min — quotes barely move intraday for this use, and it caps yfinance calls.

# Per-symbol network timeout and an overall wall-clock cap for one batch. yfinance has
# no timeout of its own, so a stalled socket would otherwise pin a worker thread forever
# and eventually exhaust FastAPI's thread pool. Timed-out symbols are treated as misses,
# which calculator handles via its avg-price fallback.
_HISTORY_TIMEOUT_SECONDS = 8.0
_BATCH_TIMEOUT_SECONDS = 20.0


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
            # pool.map yields lazily; the timeout is enforced as we iterate. On a
            # stall, a TimeoutError is raised and the symbols we never reached are
            # left as misses (calculator falls back to their avg price).
            fetched: list[StockData | None] = []
            try:
                for stock in pool.map(
                    _fetch_one, to_fetch, timeout=_BATCH_TIMEOUT_SECONDS
                ):
                    fetched.append(stock)
            except TimeoutError:
                pass
            for ticker, stock in zip(to_fetch, fetched, strict=False):
                if stock is not None:
                    _CACHE[ticker] = (stock, now)
                    result[ticker] = stock
        finally:
            # Don't block the request on threads still stuck in a hung socket; let
            # them finish (or die) in the background instead of joining them here.
            pool.shutdown(wait=False)
    return result
