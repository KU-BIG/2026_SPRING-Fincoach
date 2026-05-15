"""Mock data so each team member can develop without waiting for other modules."""

from __future__ import annotations

from datetime import date, datetime

from shared.disclaimers import REPORT_DISCLAIMER
from shared.models import (
    Account,
    AnalysisReport,
    BacktestMetrics,
    BacktestResult,
    Holding,
    Market,
    MarketOutput,
    MarketTopic,
    NewsItem,
    Portfolio,
    StockData,
    TrendingKeyword,
)


def mock_stock_data() -> dict[str, StockData]:
    return {
        "005930.KS": StockData(
            ticker="005930.KS",
            name="삼성전자",
            market=Market.KR,
            date=date.today(),
            close=71500,
            change_pct=1.42,
            volume=12345678,
            return_5d=3.2,
            volatility_20d=0.018,
        ),
        "AAPL": StockData(
            ticker="AAPL",
            name="Apple",
            market=Market.US,
            date=date.today(),
            close=185.30,
            change_pct=-0.42,
            volume=54321000,
            return_5d=1.1,
            volatility_20d=0.015,
        ),
    }


def mock_market_output() -> MarketOutput:
    return MarketOutput(
        collected_at=datetime.now(),
        market_date=date.today(),
        daily_market_summary="오늘 시장은 반도체와 AI 관련주 중심으로 강세를 보였습니다. 금리 관련 불확실성은 계속되고 있습니다.",
        stock_data=mock_stock_data(),
        trending_keywords=[
            TrendingKeyword(keyword="반도체", score=78, delta=12),
            TrendingKeyword(keyword="AI", score=85, delta=5),
            TrendingKeyword(keyword="금리", score=61, delta=9),
        ],
        raw_news=[
            NewsItem(
                title="삼성전자, AI 반도체 수요 확대 기대",
                link="https://example.com/news/1",
                published_at=datetime.now(),
                source="연합뉴스",
                summary="AI 반도체 수요 증가 기대감으로 메모리 가격이 반등할 조짐을 보이고 있다.",
                related_tickers=["005930.KS"],
                related_keywords=["반도체", "AI"],
            ),
        ],
        market_topics=[
            MarketTopic(title="반도체 업종 강세"),
            MarketTopic(title="AI 수요 기대 지속"),
            MarketTopic(title="금리 불확실성 경계"),
        ],
    )


def mock_portfolio() -> Portfolio:
    return Portfolio(
        accounts=[
            Account(
                account_name="키움증권",
                cash_krw=1_500_000,
                cash_usd=500,
                holdings=[
                    Holding(
                        name="삼성전자",
                        ticker="005930.KS",
                        market=Market.KR,
                        quantity=50,
                        avg_price=72000,
                        currency="KRW",
                    ),
                    Holding(
                        name="Apple",
                        ticker="AAPL",
                        market=Market.US,
                        quantity=10,
                        avg_price=175.50,
                        currency="USD",
                    ),
                ],
            ),
        ]
    )


def mock_analysis_report() -> AnalysisReport:
    return AnalysisReport(
        summary="기술주 중심의 공격적 포트폴리오로, 반도체 비중이 높습니다.",
        portfolio_type="공격형 기술주 중심",
        investor_match="성장주 선호 + 변동성 감내 가능한 투자자",
        risks=[
            "기술주 비중 70% 이상으로 금리 인상기에 변동성 큼",
            "단일 섹터 집중도 높음",
        ],
        strengths=["주도주 보유", "한미 분산"],
        suggestions=["방어 섹터(필수소비재, 헬스케어) 10% 검토"],
        market_context_note="오늘 반도체 강세는 보유 종목에 우호적입니다.",
        disclaimer=REPORT_DISCLAIMER,
    )


def mock_backtest_result() -> BacktestResult:
    return BacktestResult(
        period_start=date(2024, 1, 1),
        period_end=date.today(),
        initial_amount=10_000_000,
        portfolio_metrics=BacktestMetrics(
            cagr=13.2, mdd=-22.1, sharpe=0.85, total_return_pct=45.2
        ),
        benchmark_metrics={
            "QQQ": BacktestMetrics(cagr=11.4, mdd=-18.5, sharpe=0.92, total_return_pct=38.1),
            "KOSPI": BacktestMetrics(cagr=3.9, mdd=-25.3, sharpe=0.31, total_return_pct=12.3),
        },
    )
