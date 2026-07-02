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


def test_cache_evicts_expired_entries_on_insert(monkeypatch):
    """MEDIUM-B: 삽입 시 만료 항목을 스윕해 캐시가 무한 증가하지 않는다.
    캡을 잠깐 작게 낮춰, 만료된 항목이 새 삽입 때 정리되는지 확인한다."""
    import time as _time

    pf._CACHE.clear()
    monkeypatch.setattr(pf, "_MAX_CACHED_TICKERS", 2)

    now = _time.monotonic()
    # 만료된(TTL 초과) 항목 2개를 직접 심는다.
    pf._CACHE["OLD1"] = (_fake_sd("OLD1"), now - pf._TTL_SECONDS - 1)
    pf._CACHE["OLD2"] = (_fake_sd("OLD2"), now - pf._TTL_SECONDS - 1)

    # 새 항목 삽입 → 캡(2)에 도달했으므로 만료 스윕이 돌아 OLD1/OLD2 가 빠진다.
    pf._cache_store("NEW", _fake_sd("NEW"), now)

    assert "NEW" in pf._CACHE
    assert "OLD1" not in pf._CACHE
    assert "OLD2" not in pf._CACHE
    assert len(pf._CACHE) <= pf._MAX_CACHED_TICKERS


def test_cache_enforces_size_cap_when_all_fresh(monkeypatch):
    """만료 항목이 없어도(모두 fresh) 캡을 넘기지 않는다 — 가장 오래된 것부터 축출."""
    import time as _time

    pf._CACHE.clear()
    monkeypatch.setattr(pf, "_MAX_CACHED_TICKERS", 3)

    base = _time.monotonic()
    # 캡까지 fresh 항목을 채운다 (timestamp 를 조금씩 증가시켜 나이 순 확정).
    for i in range(3):
        pf._cache_store(f"T{i}", _fake_sd(f"T{i}"), base + i)

    # 한 개 더 넣으면 가장 오래된 T0 가 축출되고 캡은 유지된다.
    pf._cache_store("T3", _fake_sd("T3"), base + 3)

    assert len(pf._CACHE) <= 3
    assert "T3" in pf._CACHE
    assert "T0" not in pf._CACHE  # oldest evicted


def test_fetch_collects_completed_out_of_order(monkeypatch):
    """LOW-C: 앞선 종목이 느려도(입력 순서상 먼저) 뒤의 정상 종목을 미스로
    만들지 않는다. as_completed 로 완료순 수집하므로, 배치 데드라인을 넘긴
    느린 종목만 미스가 되고 빠른 종목은 살아남는다."""
    import time as _time

    pf._CACHE.clear()
    monkeypatch.setattr(pf, "_BATCH_TIMEOUT_SECONDS", 0.4)

    def _slow_first(t: str):
        if t == "SLOW":
            _time.sleep(5)  # 배치 데드라인을 훨씬 넘김 → 미스
            return _fake_sd(t)
        return _fake_sd(t)

    monkeypatch.setattr(pf, "_fetch_one", _slow_first)

    # 입력 순서상 SLOW 가 먼저. pool.map 이었다면 SLOW 가 뒤 종목까지 막았다.
    start = _time.monotonic()
    out = pf.fetch_stock_data(["SLOW", "FAST1", "FAST2"])
    elapsed = _time.monotonic() - start

    assert elapsed < 3  # 느린 종목 때문에 막히지 않고 즉시 반환
    assert "FAST1" in out  # 뒤 종목이 미스가 아니다
    assert "FAST2" in out
    assert "SLOW" not in out  # 데드라인 넘긴 것만 미스


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
