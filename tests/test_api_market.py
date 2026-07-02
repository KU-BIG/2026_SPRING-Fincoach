"""GET/POST /api/market/summary 엔드포인트 테스트."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from api.main import app
from api.market import DEFAULT_TICKERS, MAX_TICKERS
from shared.mocks import mock_market_output

client = TestClient(app)


def test_market_summary_default_uses_default_tickers():
    """tickers 파라미터 없으면 DEFAULT_TICKERS로 collect_market 호출함."""
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get("/api/market/summary")

    assert res.status_code == 200
    mock.assert_called_once_with(DEFAULT_TICKERS)
    data = res.json()
    assert "collected_at" in data
    assert "market_date" in data
    assert "daily_market_summary" in data
    assert "trending_keywords" in data
    assert isinstance(data["trending_keywords"], list)


def test_market_summary_with_tickers_param():
    """tickers 쿼리 파라미터로 지정한 종목으로 collect_market 호출함."""
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get("/api/market/summary?tickers=AAPL,005930.KS")

    assert res.status_code == 200
    mock.assert_called_once_with(["AAPL", "005930.KS"])


def test_market_summary_empty_tickers_falls_back_to_default():
    """tickers 파라미터가 비어있으면 DEFAULT_TICKERS로 fallback함."""
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get("/api/market/summary?tickers=")

    assert res.status_code == 200
    mock.assert_called_once_with(DEFAULT_TICKERS)


def test_market_summary_lowercase_tickers_converted_to_upper():
    """소문자 티커 입력 시 대문자로 변환해 collect_market 호출함."""
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get("/api/market/summary?tickers=aapl,005930.ks")

    assert res.status_code == 200
    mock.assert_called_once_with(["AAPL", "005930.KS"])


def test_market_summary_duplicate_tickers_deduplicated():
    """중복 티커 입력 시 순서 유지하며 중복 제거해 collect_market 호출함."""
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get("/api/market/summary?tickers=AAPL,NVDA,AAPL")

    assert res.status_code == 200
    mock.assert_called_once_with(["AAPL", "NVDA"])


# ── POST /api/market/summary (보유종목 기반) ──────────────────────────────────


def test_post_market_summary_uses_holdings_tickers():
    """보유종목 holdings 넘기면 해당 티커로 collect_market 호출함."""
    holdings = [
        {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000, "currency": "KRW"},
        {"ticker": "AAPL", "name": "Apple", "shares": 5, "avg_price": 180, "currency": "USD"},
    ]
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.post("/api/market/summary", json={"holdings": holdings})

    assert res.status_code == 200
    mock.assert_called_once_with(["005930.KS", "AAPL"])
    data = res.json()
    assert "collected_at" in data
    assert "market_date" in data
    assert "daily_market_summary" in data
    assert "trending_keywords" in data


def test_post_market_summary_empty_holdings_falls_back_to_default():
    """holdings가 빈 리스트면 DEFAULT_TICKERS로 fallback함."""
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.post("/api/market/summary", json={"holdings": []})

    assert res.status_code == 200
    mock.assert_called_once_with(DEFAULT_TICKERS)


def test_post_market_summary_deduplicates_and_uppercases_tickers():
    """소문자/중복 티커 정규화함."""
    holdings = [
        {"ticker": "aapl"},
        {"ticker": "AAPL"},
        {"ticker": "nvda"},
    ]
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.post("/api/market/summary", json={"holdings": holdings})

    assert res.status_code == 200
    mock.assert_called_once_with(["AAPL", "NVDA"])


# ── H1/M2: 티커 개수 상한 (DoS 방지) ─────────────────────────────────────────


def test_market_summary_at_cap_still_ok():
    """정확히 MAX_TICKERS 개는 통과 — 경계값이 막히지 않는지 확인."""
    tickers = ",".join(f"T{i}" for i in range(MAX_TICKERS))
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get(f"/api/market/summary?tickers={tickers}")

    assert res.status_code == 200
    # 상한과 같은 개수의 고유 티커가 그대로 전달된다.
    (called_arg,) = mock.call_args.args
    assert len(called_arg) == MAX_TICKERS


def test_market_summary_over_cap_returns_422():
    """MAX_TICKERS 초과 요청은 422 — collect_market 를 아예 호출하지 않는다.

    PoC 재현: ``?tickers=T1,...,T<huge>`` 무토큰 GET 이 스레드풀을 태우는 것을
    막는다. 무제한 fan-out 이 외부 fetch 로 이어지기 전에 경계에서 거부한다.
    """
    tickers = ",".join(f"T{i}" for i in range(MAX_TICKERS + 5))
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get(f"/api/market/summary?tickers={tickers}")

    assert res.status_code == 422
    mock.assert_not_called()


def test_market_summary_huge_ticker_flood_rejected_before_fetch():
    """대량 티커 플러드(2000개)도 fetch 전에 422 로 단락된다."""
    tickers = ",".join(f"T{i}" for i in range(2000))
    with patch("api.market.collect_market", return_value=mock_market_output()) as mock:
        res = client.get(f"/api/market/summary?tickers={tickers}")

    assert res.status_code == 422
    mock.assert_not_called()


def test_market_prefix_is_rate_limited():
    """/api/market 이 IP 레이트리밋 프리픽스에 포함돼 있어야 한다 (#161/#162).

    미들웨어가 붙지 않으면 무토큰 동시 GET 플러드로 스레드풀을 고갈시킬 수 있다.
    """
    from api.ratelimit import RATE_LIMITED_PREFIXES

    assert "/api/market/summary".startswith(RATE_LIMITED_PREFIXES)
