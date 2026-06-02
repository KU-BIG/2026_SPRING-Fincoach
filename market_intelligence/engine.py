"""시장 데이터 수집 진입점 — 현태/수빈/웹 UI가 호출함.

현재는 shared.mocks 기반 mock 반환. 이후 PR에서 pykrx/yfinance/RSS 실데이터 연동 예정.
외부 API 실패 시에도 앱이 죽지 않도록 mock fallback 유지함.
"""

from __future__ import annotations

from shared.mocks import mock_market_output
from shared.models import MarketOutput


def collect_market(tickers: list[str]) -> MarketOutput:
    """종목 티커 리스트를 받아 시장 데이터를 수집해 ``MarketOutput``으로 반환함.

    현재 구현은 ``shared.mocks.mock_market_output()`` 반환만 함. 실데이터 연동은
    이후 PR에서 진행하며, 그때도 외부 API 실패 시 mock fallback을 유지함.

    Args:
        tickers: 수집 대상 종목 티커 리스트 (예: ``["005930.KS", "AAPL"]``).

    Returns:
        ``shared.models.MarketOutput`` 객체.
    """
    return mock_market_output()
