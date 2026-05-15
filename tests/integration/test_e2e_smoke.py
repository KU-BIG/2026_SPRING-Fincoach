"""E2E smoke test - 전체 데이터 흐름이 mock으로 통과하는지 확인.

은서 mock → 현태 mock → 수빈 ChatContext 조립까지.
"""

from __future__ import annotations

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
