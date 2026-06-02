"""market_intelligence.collect_market 가 MarketOutput 계약을 지키는지 확인."""

from market_intelligence import collect_market
from shared.models import MarketOutput


def test_collect_market_returns_market_output():
    result = collect_market(["005930.KS", "AAPL"])
    assert isinstance(result, MarketOutput)


def test_collect_market_empty_tickers():
    result = collect_market([])
    assert isinstance(result, MarketOutput)


def test_collect_market_output_has_stock_data():
    result = collect_market(["005930.KS"])
    assert isinstance(result.stock_data, dict)
    assert result.daily_market_summary
