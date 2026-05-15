"""Pydantic 데이터 계약 검증.

shared/models의 모든 모델이 mock 데이터로 정상 검증되는지 확인.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from shared.mocks import (
    mock_analysis_report,
    mock_backtest_result,
    mock_market_output,
    mock_portfolio,
    mock_stock_data,
)
from shared.models import (
    AnalysisReport,
    BacktestResult,
    Market,
    MarketOutput,
    Portfolio,
    StockData,
)


def test_mock_market_output_validates() -> None:
    m = mock_market_output()
    assert isinstance(m, MarketOutput)
    assert m.daily_market_summary
    assert len(m.stock_data) > 0


def test_mock_portfolio_validates() -> None:
    p = mock_portfolio()
    assert isinstance(p, Portfolio)
    assert len(p.accounts) > 0
    assert all(h.market in (Market.KR, Market.US) for acc in p.accounts for h in acc.holdings)


def test_mock_analysis_report_validates() -> None:
    r = mock_analysis_report()
    assert isinstance(r, AnalysisReport)
    assert r.disclaimer


def test_mock_backtest_result_validates() -> None:
    b = mock_backtest_result()
    assert isinstance(b, BacktestResult)
    assert b.portfolio_metrics.cagr is not None
    assert "QQQ" in b.benchmark_metrics or "KOSPI" in b.benchmark_metrics


def test_stock_data_serializable() -> None:
    sd = mock_stock_data()
    for ticker, data in sd.items():
        assert isinstance(data, StockData)
        assert data.ticker == ticker


def test_portfolio_rejects_empty_accounts() -> None:
    with pytest.raises(ValidationError):
        Portfolio(accounts=[])


def test_models_json_roundtrip() -> None:
    """모델 → JSON → 모델 라운드트립."""
    m = mock_market_output()
    j = m.model_dump_json()
    m2 = MarketOutput.model_validate_json(j)
    assert m2.daily_market_summary == m.daily_market_summary
