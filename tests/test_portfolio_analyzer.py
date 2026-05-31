"""portfolio_analyzer 공개 함수 4개 + 계산 정확성 검증."""

from portfolio_analyzer import (
    get_analysis_report,
    get_backtest_result,
    get_portfolio_data,
    get_stock_chart,
)

# --- get_portfolio_data ---

def test_get_portfolio_data_returns_dict():
    result = get_portfolio_data()
    assert isinstance(result, dict)
    assert "accounts" in result
    assert "summary" in result
    assert "errors" in result
    assert isinstance(result["accounts"], list)


def test_portfolio_summary_total_value():
    """mock 데이터 기준 total_value_krw 검증.

    삼성전자: 50 * 71500 = 3,575,000
    Apple: 10 * 185.30 * 1400 = 2,594,200
    현금: 1,500,000 + 500 * 1400 = 2,200,000
    합계: 8,369,200
    """
    result = get_portfolio_data()
    assert result["summary"]["total_value_krw"] == 8_369_200


def test_portfolio_summary_total_pnl():
    """mock 데이터 기준 total_pnl_krw 검증.

    삼성전자: (71500 - 72000) * 50 = -25,000
    Apple: (185.30 - 175.50) * 10 * 1400 = 137,200
    합계: 112,200
    """
    result = get_portfolio_data()
    assert result["summary"]["total_pnl_krw"] == 112_200


def test_portfolio_summary_pnl_pct():
    """수익률 = total_pnl / total_cost * 100."""
    result = get_portfolio_data()
    # cost: 3,600,000 + 2,457,000 = 6,057,000
    expected_pct = round(112_200 / 6_057_000 * 100, 2)
    assert result["summary"]["pnl_pct"] == expected_pct


def test_portfolio_positions():
    result = get_portfolio_data()
    assert "positions" in result
    positions = result["positions"]
    assert len(positions) == 2

    samsung = next(p for p in positions if p["ticker"] == "005930.KS")
    assert samsung["name"] == "삼성전자"
    assert samsung["current_value_krw"] == 3_575_000
    assert samsung["pnl_krw"] == -25_000

    apple = next(p for p in positions if p["ticker"] == "AAPL")
    assert apple["name"] == "Apple"
    assert apple["current_value_krw"] == 2_594_200
    assert apple["pnl_krw"] == 137_200


def test_portfolio_positions_weight_sum():
    """비중 합이 100%가 아닐 수 있음 (현금 비중 미포함). 각 비중 > 0 확인."""
    result = get_portfolio_data()
    for p in result["positions"]:
        assert p["weight"] > 0


def test_portfolio_holdings_enriched():
    """accounts 안의 holdings에 계산 필드가 추가되었는지 확인."""
    result = get_portfolio_data()
    holding = result["accounts"][0]["holdings"][0]
    assert "current_value_krw" in holding
    assert "pnl_krw" in holding
    assert "pnl_pct" in holding
    assert "weight" in holding


# --- get_analysis_report ---

def test_get_analysis_report_returns_dict():
    result = get_analysis_report()
    assert isinstance(result, dict)
    assert "summary" in result
    assert "disclaimer" in result


def test_get_analysis_report_force_refresh():
    result = get_analysis_report(force_refresh=True)
    assert isinstance(result, dict)


# --- get_backtest_result ---

def test_get_backtest_result_returns_dict():
    result = get_backtest_result()
    assert isinstance(result, dict)
    assert "period" in result
    assert "portfolio_metrics" in result


def test_get_backtest_result_custom_period():
    result = get_backtest_result(period="6mo")
    assert result["period"] == "6mo"


# --- get_stock_chart ---

def test_get_stock_chart_returns():
    result = get_stock_chart("005930.KS")
    assert result["ticker"] == "005930.KS"
    assert result["period"] == "1mo"


def test_get_stock_chart_custom_period():
    result = get_stock_chart("AAPL", period="3mo")
    assert result["ticker"] == "AAPL"
    assert result["period"] == "3mo"
