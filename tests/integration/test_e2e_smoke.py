"""E2E smoke test - 전체 데이터 흐름이 mock으로 통과하는지 확인.

은서 mock → 현태 mock → 수빈 ChatContext 조립까지.
"""

from __future__ import annotations

from unittest.mock import patch

from shared.mocks import mock_analysis_report, mock_market_output
from shared.models import ChatContext, ChatMessage


def test_e2e_chat_context_assembly() -> None:
    market = mock_market_output()
    report = mock_analysis_report()

    ctx = ChatContext(
        market=market,
        portfolio_data={"summary": {"total_value": 10_000_000}},
        analysis_report=report,
        history=[ChatMessage(role="user", content="삼성전자 오늘 어때?")],
    )

    assert ctx.market is not None
    assert ctx.analysis_report is not None
    assert len(ctx.history) == 1


# ── holdings → 컨텍스트 → 시스템 프롬프트 체인 (#137) ─────────────────────────

_HOLDINGS = [
    {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000, "currency": "KRW"},
    {"ticker": "AAPL", "name": "Apple", "shares": 2, "avg_price": 180, "currency": "USD"},
]

_MOCK_PORTFOLIO = {
    "summary": {"total_value_krw": 1_200_000, "total_pnl_krw": 60000, "pnl_pct": 5.0},
    "positions": [
        {"ticker": "005930.KS", "name": "삼성전자", "weight": 70.0, "pnl_pct": 3.0},
        {"ticker": "AAPL", "name": "Apple", "weight": 30.0, "pnl_pct": 8.0},
    ],
    "accounts": [],
}

_MOCK_ANALYSIS = {
    "summary": "기술주 혼합", "characteristics": [], "strengths": [],
    "risks": [], "suggestions": [], "disclaimer": "정보 제공 목적입니다.",
}


def test_e2e_holdings_to_system_prompt() -> None:
    """로그인 유저 holdings가 build_context → 시스템 프롬프트까지 흘러가는지 확인."""
    from api.chat import _build_system_prompt
    from coach_chat.context_builder import build_context

    with (
        patch("coach_chat.context_builder.get_portfolio_data", return_value=_MOCK_PORTFOLIO),
        patch("coach_chat.context_builder.get_analysis_report", return_value=_MOCK_ANALYSIS),
        patch("coach_chat.context_builder.collect_market", return_value=mock_market_output()),
    ):
        ctx = build_context("포트폴리오 분석해줘", holdings=_HOLDINGS)

    assert ctx.portfolio_data is not None
    positions = ctx.portfolio_data.get("positions", [])
    tickers = [p["ticker"] for p in positions]
    assert "005930.KS" in tickers
    assert "AAPL" in tickers

    system = _build_system_prompt(ctx.market, ctx.portfolio_data)
    assert "삼성전자" in system
    assert "Apple" in system
    assert "사용자 포트폴리오" in system


def test_e2e_empty_holdings_no_mock_fallback() -> None:
    """holdings=[] (보유종목 0개 유저)는 mock으로 대체되지 않고 빈 포트폴리오로 컨텍스트를 구성한다."""
    from api.chat import _build_system_prompt
    from coach_chat.context_builder import build_context

    empty_portfolio = {
        "summary": {"total_value_krw": 0, "total_pnl_krw": 0, "pnl_pct": 0.0},
        "positions": [],
        "accounts": [],
    }

    with (
        patch("coach_chat.context_builder.get_portfolio_data", return_value=empty_portfolio) as mock_pd,
        patch("coach_chat.context_builder.get_analysis_report", return_value=_MOCK_ANALYSIS),
        patch("coach_chat.context_builder.collect_market", return_value=mock_market_output()),
    ):
        ctx = build_context("포트폴리오 알려줘", holdings=[])

    mock_pd.assert_called_once_with(holdings=[])
    assert ctx.portfolio_data is not None
    assert ctx.portfolio_data["positions"] == []

    system = _build_system_prompt(ctx.market, ctx.portfolio_data)
    assert "사용자 포트폴리오" in system
