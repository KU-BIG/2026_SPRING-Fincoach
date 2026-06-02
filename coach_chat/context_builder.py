"""ChatContext 조립 — LLM에 주입할 컨텍스트를 만든다.

현재는 mock 데이터 기반. 실제 모듈 연동 시 import만 교체하면 됨.
"""

from __future__ import annotations

from portfolio_analyzer import get_analysis_report, get_portfolio_data
from shared.mocks import mock_market_output
from shared.models import AnalysisReport, ChatContext, ChatMessage


def build_context(
    question: str,
    history: list[ChatMessage] | None = None,
) -> ChatContext:
    """질문과 현재 데이터를 묶어 ChatContext를 반환한다."""
    market = mock_market_output()
    portfolio_data = get_portfolio_data()
    analysis_report = AnalysisReport(**get_analysis_report())

    return ChatContext(
        market=market,
        portfolio_data=portfolio_data,
        analysis_report=analysis_report,
        history=history or [],
    )
