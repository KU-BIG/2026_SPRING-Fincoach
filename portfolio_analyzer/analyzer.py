"""공개 함수 4개 — 수빈/웹 UI가 호출하는 진입점.

현재는 shared.mocks 기반 mock 반환. 이후 PR에서 실제 데이터 연동 예정.
"""

from __future__ import annotations

from shared.mocks import mock_analysis_report, mock_backtest_result, mock_portfolio


def get_portfolio_data() -> dict:
    """포트폴리오 요약 데이터 반환. 빠름, dashboard 상시 호출 OK."""
    portfolio = mock_portfolio()
    accounts = []
    for acc in portfolio.accounts:
        accounts.append({
            "account_name": acc.account_name,
            "cash_krw": acc.cash_krw,
            "cash_usd": acc.cash_usd,
            "holdings": [h.model_dump() for h in acc.holdings],
        })

    return {
        "accounts": accounts,
        "summary": {
            "total_value": 0,
            "total_pnl": 0,
        },
        "errors": [],
    }


def get_analysis_report(force_refresh: bool = False) -> dict:
    """LLM 분석 리포트 반환. 느린 함수, 요청 시만 호출."""
    report = mock_analysis_report()
    return report.model_dump()


def get_backtest_result(period: str = "1y") -> dict:
    """백테스트 결과 반환. 느린 함수, 요청 시만 호출."""
    result = mock_backtest_result()
    data = result.model_dump()
    data["period"] = period
    return data


def get_stock_chart(ticker: str, period: str = "1mo"):
    """종목별 차트 반환. 현재는 placeholder dict, 이후 plotly Figure 예정."""
    return {
        "ticker": ticker,
        "period": period,
        "chart_type": "placeholder",
        "message": "차트 데이터는 다음 PR에서 구현 예정",
    }
