"""GET /api/market/summary 엔드포인트 테스트."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from api.main import app
from shared.mocks import mock_market_output

client = TestClient(app)


def test_market_summary_returns_200_with_expected_keys():
    with patch("api.market.collect_market", return_value=mock_market_output()):
        res = client.get("/api/market/summary")

    assert res.status_code == 200
    data = res.json()
    assert "collected_at" in data
    assert "market_date" in data
    assert "daily_market_summary" in data
    assert "trending_keywords" in data
    assert isinstance(data["trending_keywords"], list)
