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


# --- C2: KR ticker forces KRW, client currency override ignored ---

def test_kr_ticker_ignores_client_usd_currency():
    """005930.KS(KRW) 종목에 currency=USD를 주더라도 fx가 곱해지면 안 된다.

    mock 종가 71500 * 10주 = 715,000원. currency override가 먹으면 1400배(1,001,000,000)로 뻥튀기된다.
    """
    holdings = [
        {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000, "currency": "USD"}
    ]
    data = get_portfolio_data(holdings=holdings)
    assert data["summary"]["total_value_krw"] == 715_000


def test_kr_ticker_currency_matches_krw_baseline():
    """currency=USD 결과가 currency=KRW 결과와 동일해야 한다 (KR 티커는 통화 무시)."""
    base = {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000}
    usd = get_portfolio_data(holdings=[{**base, "currency": "USD"}])
    krw = get_portfolio_data(holdings=[{**base, "currency": "KRW"}])
    assert usd["summary"]["total_value_krw"] == krw["summary"]["total_value_krw"]


def test_kq_ticker_forces_krw():
    """.KQ(코스닥) 티커도 KRW로 강제된다."""
    holdings = [
        {"ticker": "247540.KQ", "name": "에코프로비엠", "shares": 2, "avg_price": 100000, "currency": "USD"}
    ]
    data = get_portfolio_data(holdings=holdings)
    # 시세 없음 -> avg_price fallback: 2 * 100000 = 200,000원 (fx 미적용)
    assert data["summary"]["total_value_krw"] == 200_000


# --- M6: robust LLM JSON extraction ---

def test_extract_json_object_plain():
    from portfolio_analyzer.analyzer import _extract_json_object

    assert _extract_json_object('{"summary": "ok"}') == '{"summary": "ok"}'


def test_extract_json_object_with_leading_prose_and_fence():
    import json

    from portfolio_analyzer.analyzer import _extract_json_object

    text = 'Here is your analysis:\n```json\n{"summary": "ok", "portfolio_type": "성장형"}\n```'
    parsed = json.loads(_extract_json_object(text))
    assert parsed["summary"] == "ok"
    assert parsed["portfolio_type"] == "성장형"


def test_extract_json_object_ignores_braces_inside_strings():
    import json

    from portfolio_analyzer.analyzer import _extract_json_object

    text = 'prefix {"note": "a } brace in a string", "x": 1} suffix'
    parsed = json.loads(_extract_json_object(text))
    assert parsed["note"] == "a } brace in a string"
    assert parsed["x"] == 1
