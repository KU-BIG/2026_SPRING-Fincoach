"""price_fetcher unit tests — yfinance is mocked so nothing touches the network."""

from datetime import date

import portfolio_analyzer.price_fetcher as pf
from shared.models import Market, StockData


def test_normalize_kr_code_gets_ks_suffix():
    assert pf._normalize("005930") == "005930.KS"
    assert pf._normalize(" 000660 ") == "000660.KS"


def test_normalize_passthrough_for_suffixed_and_us():
    assert pf._normalize("005930.KS") == "005930.KS"
    assert pf._normalize("aapl") == "AAPL"


def test_market_for_suffix():
    assert pf._market_for("005930.KS") == Market.KR
    assert pf._market_for("042660.KQ") == Market.KR
    assert pf._market_for("AAPL") == Market.US


def _fake_sd(ticker: str) -> StockData:
    return StockData(
        ticker=ticker,
        name=ticker,
        market=pf._market_for(pf._normalize(ticker)),
        date=date.today(),
        close=100.0,
        change_pct=1.0,
        volume=0,
    )


def test_fetch_stock_data_returns_quotes(monkeypatch):
    pf._CACHE.clear()
    monkeypatch.setattr(pf, "_fetch_one", lambda t: _fake_sd(t))
    out = pf.fetch_stock_data(["005930.KS", "AAPL"])
    assert set(out) == {"005930.KS", "AAPL"}
    assert out["005930.KS"].close == 100.0


def test_fetch_stock_data_omits_failed_symbols(monkeypatch):
    pf._CACHE.clear()
    monkeypatch.setattr(pf, "_fetch_one", lambda t: _fake_sd(t) if t == "AAPL" else None)
    out = pf.fetch_stock_data(["BADTICKER", "AAPL"])
    assert "AAPL" in out
    assert "BADTICKER" not in out


def test_get_portfolio_data_live_path_uses_fetched_price(monkeypatch):
    """With FINCOACH_LIVE_PRICES set, the holdings path prices from the live fetch."""
    pf._CACHE.clear()
    monkeypatch.setenv("FINCOACH_LIVE_PRICES", "1")
    monkeypatch.setattr(pf, "_fetch_one", lambda t: _fake_sd(t))

    from portfolio_analyzer.analyzer import get_portfolio_data

    holdings = [{"ticker": "005930.KS", "name": "삼성전자", "shares": 2, "avg_price": 50.0, "currency": "KRW"}]
    data = get_portfolio_data(holdings=holdings)
    pos = data["positions"][0]
    # live close 100 vs avg 50 => +100%
    assert pos["pnl_pct"] == 100.0


def test_fetch_stock_data_timeout_yields_misses(monkeypatch):
    """A stalled fetch must not hang the batch: slow symbols are dropped as misses.

    We shrink the batch timeout and make one symbol sleep past it. The slow symbol is
    omitted (calculator would fall back to avg price) while the fast one still returns.
    """
    import time as _time

    pf._CACHE.clear()
    monkeypatch.setattr(pf, "_BATCH_TIMEOUT_SECONDS", 0.3)

    def _slow_or_fast(t: str):
        if t == "SLOW":
            _time.sleep(5)  # would pin a worker forever without the timeout
            return _fake_sd(t)
        return _fake_sd(t)

    monkeypatch.setattr(pf, "_fetch_one", _slow_or_fast)

    start = _time.monotonic()
    out = pf.fetch_stock_data(["FAST", "SLOW"])
    elapsed = _time.monotonic() - start

    # Returns promptly (well under the 5s sleep) and the slow symbol is a miss.
    assert elapsed < 3
    assert "SLOW" not in out


def test_get_portfolio_data_without_env_is_offline(monkeypatch):
    """Unset env keeps the mock path (no network) so CI/local stay offline-safe."""
    monkeypatch.delenv("FINCOACH_LIVE_PRICES", raising=False)
    monkeypatch.delenv("RENDER", raising=False)

    def _boom(_):
        raise AssertionError("fetch_stock_data must not run without FINCOACH_LIVE_PRICES")

    monkeypatch.setattr(pf, "_fetch_one", _boom)

    from portfolio_analyzer.analyzer import get_portfolio_data

    holdings = [{"ticker": "005930.KS", "name": "삼성전자", "shares": 1, "avg_price": 60000, "currency": "KRW"}]
    data = get_portfolio_data(holdings=holdings)
    assert data["summary"]["total_value_krw"] > 0
