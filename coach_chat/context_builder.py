"""ChatContext 조립 — LLM에 주입할 컨텍스트를 만든다."""

from __future__ import annotations

import logging

from market_intelligence.engine import collect_market
from portfolio_analyzer import get_analysis_report, get_portfolio_data
from shared.models import AnalysisReport, ChatContext, ChatMessage

logger = logging.getLogger(__name__)


def _tickers_from_portfolio(portfolio_data: dict) -> list[str]:
    return [p["ticker"] for p in portfolio_data.get("positions", [])]


def build_context(
    question: str,
    history: list[ChatMessage] | None = None,
) -> ChatContext:
    """질문과 현재 데이터를 묶어 ChatContext를 반환한다.

    외부 모듈 호출이 실패해도 빈 컨텍스트로 fallback해 LLM 답변은 유지된다.
    """
    portfolio_data: dict | None = None
    try:
        portfolio_data = get_portfolio_data()
    except Exception as exc:
        logger.warning("portfolio 데이터 로드 실패: %s", exc)

    market = None
    try:
        tickers = _tickers_from_portfolio(portfolio_data) if portfolio_data else []
        market = collect_market(tickers=tickers or ["005930.KS", "AAPL"])
    except Exception as exc:
        logger.warning("market 데이터 로드 실패: %s", exc)

    analysis_report: AnalysisReport | None = None
    try:
        if portfolio_data:
            analysis_report = AnalysisReport(**get_analysis_report())
    except Exception as exc:
        logger.warning("analysis_report 로드 실패: %s", exc)

    return ChatContext(
        market=market,
        portfolio_data=portfolio_data,
        analysis_report=analysis_report,
        history=history or [],
    )
