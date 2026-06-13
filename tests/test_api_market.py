"""GET /api/market/summary 엔드포인트 테스트."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from api.main import app
from api.market import DEFAULT_TICKERS
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
