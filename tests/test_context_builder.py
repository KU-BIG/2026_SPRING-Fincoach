"""context_builder 기본 동작 테스트."""

from datetime import datetime
from unittest.mock import patch

from coach_chat.context_builder import build_context
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
