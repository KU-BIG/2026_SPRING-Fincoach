"""context_builder 기본 동작 테스트."""

from datetime import datetime
from unittest.mock import patch

from coach_chat.context_builder import build_context
from shared.mocks import mock_market_output
from shared.models import AnalysisReport, ChatContext, ChatMessage, MarketOutput


def test_build_context_returns_chat_context():
    ctx = build_context("삼성전자 오늘 어때?")
    assert isinstance(ctx, ChatContext)


def test_build_context_market_populated():
    ctx = build_context("시장 요약 알려줘")
    assert isinstance(ctx.market, MarketOutput)
    assert ctx.market.daily_market_summary


def test_build_context_portfolio_populated():
    ctx = build_context("내 포트폴리오 어때?")
    assert ctx.portfolio_data is not None
    assert "accounts" in ctx.portfolio_data


def test_build_context_analysis_report_populated():
    ctx = build_context("내 포트폴리오 분석해줘")
    assert isinstance(ctx.analysis_report, AnalysisReport)
    assert ctx.analysis_report.disclaimer


def test_build_context_empty_history_by_default():
    ctx = build_context("질문")
    assert ctx.history == []


def test_build_context_history_passed_through():
    history = [ChatMessage(role="user", content="이전 질문", created_at=datetime.now())]
    ctx = build_context("다음 질문", history=history)
    assert len(ctx.history) == 1
    assert ctx.history[0].content == "이전 질문"


def test_build_context_real_data_injected():
    """실 모듈 데이터가 ChatContext에 채워지는지 확인."""
    ctx = build_context("보유 종목 알려줘")
    assert isinstance(ctx.market, MarketOutput)
    assert ctx.portfolio_data is not None
    positions = ctx.portfolio_data.get("positions", [])
    assert len(positions) > 0
    assert all("ticker" in p and "weight" in p for p in positions)


SAMPLE_HOLDINGS = [
    {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000, "currency": "KRW"},
    {"ticker": "AAPL", "name": "Apple", "shares": 2, "avg_price": 180, "currency": "USD"},
]

MOCK_PORTFOLIO = {
    "summary": {"total_value_krw": 1_000_000, "total_pnl_krw": 50000, "pnl_pct": 5.0},
    "positions": [
        {"ticker": "005930.KS", "name": "삼성전자", "weight": 70.0, "pnl_pct": 3.0},
        {"ticker": "AAPL", "name": "Apple", "weight": 30.0, "pnl_pct": 8.0},
    ],
    "accounts": [],
}

MOCK_ANALYSIS = {
    "summary": "기술주 혼합 포트폴리오",
    "portfolio_type": "성장형",
    "investor_match": "공격 투자자",
    "strengths": [],
    "risks": [],
    "suggestions": [],
    "disclaimer": "본 분석은 정보 제공 목적입니다.",
}


def test_build_context_holdings_passed_to_portfolio():
    """holdings가 get_portfolio_data / get_analysis_report에 그대로 전달되는지 확인."""
    with (
        patch("coach_chat.context_builder.get_portfolio_data", return_value=MOCK_PORTFOLIO) as mock_pd,
        patch("coach_chat.context_builder.get_analysis_report", return_value=MOCK_ANALYSIS),
        patch("coach_chat.context_builder.collect_market", return_value=mock_market_output()),
    ):
        build_context("포트폴리오 알려줘", holdings=SAMPLE_HOLDINGS)
    mock_pd.assert_called_once_with(holdings=SAMPLE_HOLDINGS)


def test_build_context_empty_holdings_not_mock():
    """holdings=[] (보유종목 0개 로그인 유저)는 mock 경로가 아닌 실데이터 경로로 처리된다."""
    with (
        patch("coach_chat.context_builder.get_portfolio_data", return_value=MOCK_PORTFOLIO) as mock_pd,
        patch("coach_chat.context_builder.get_analysis_report", return_value=MOCK_ANALYSIS),
        patch("coach_chat.context_builder.collect_market", return_value=mock_market_output()),
    ):
        build_context("포트폴리오 알려줘", holdings=[])
    mock_pd.assert_called_once_with(holdings=[])


def test_build_context_none_holdings_uses_mock_path():
    """holdings=None (비로그인)은 get_portfolio_data(holdings=None)으로 mock 경로를 탄다."""
    with (
        patch("coach_chat.context_builder.get_portfolio_data", return_value=MOCK_PORTFOLIO) as mock_pd,
        patch("coach_chat.context_builder.get_analysis_report", return_value=MOCK_ANALYSIS),
        patch("coach_chat.context_builder.collect_market", return_value=mock_market_output()),
    ):
        build_context("포트폴리오 알려줘", holdings=None)
    mock_pd.assert_called_once_with(holdings=None)


def test_build_context_fallback_on_external_failure():
    """market/portfolio 외부 호출이 실패해도 빈 컨텍스트로 fallback된다."""
    with (
        patch("coach_chat.context_builder.collect_market", side_effect=RuntimeError("network")),
        patch("coach_chat.context_builder.get_portfolio_data", side_effect=RuntimeError("db")),
    ):
        ctx = build_context("질문")
    assert isinstance(ctx, ChatContext)
    assert ctx.market is None
    assert ctx.portfolio_data is None
    assert ctx.analysis_report is None
