"""portfolio_analyzer 공개 함수 4개가 깨지지 않고 반환하는지 확인."""

from portfolio_analyzer import (
    get_analysis_report,
    get_backtest_result,
    get_portfolio_data,
    get_stock_chart,
)


def test_get_portfolio_data_returns_dict():
    result = get_portfolio_data()
    assert isinstance(result, dict)
    assert "accounts" in result
    assert "summary" in result
    assert "errors" in result
    assert isinstance(result["accounts"], list)


def test_get_analysis_report_returns_dict():
    result = get_analysis_report()
    assert isinstance(result, dict)
    assert "summary" in result
    assert "disclaimer" in result


def test_get_analysis_report_force_refresh():
    result = get_analysis_report(force_refresh=True)
    assert isinstance(result, dict)


def test_get_backtest_result_returns_dict():
    result = get_backtest_result()
    assert isinstance(result, dict)
    assert "period" in result
    assert "portfolio_metrics" in result


def test_get_backtest_result_custom_period():
    result = get_backtest_result(period="6mo")
    assert result["period"] == "6mo"


def test_get_stock_chart_returns():
    result = get_stock_chart("005930.KS")
    assert result["ticker"] == "005930.KS"
    assert result["period"] == "1mo"


def test_get_stock_chart_custom_period():
    result = get_stock_chart("AAPL", period="3mo")
    assert result["ticker"] == "AAPL"
    assert result["period"] == "3mo"
