"""Data contracts between modules.

These Pydantic models are the source of truth for inter-module communication.
Changes require an ADR in docs/decisions/ and 병승 review.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Market(StrEnum):
    KR = "KR"
    US = "US"


class StockData(BaseModel):
    ticker: str
    name: str
    market: Market
    date: date
    close: float
    change_pct: float
    volume: int
    return_5d: float | None = None
    volatility_20d: float | None = None


class NewsItem(BaseModel):
    title: str
    link: str
    published_at: datetime
    source: str
    summary: str
    related_tickers: list[str] = Field(default_factory=list)
    related_keywords: list[str] = Field(default_factory=list)


class TrendingKeyword(BaseModel):
    keyword: str
    score: int
    delta: int


class MarketTopic(BaseModel):
    title: str
    description: str = ""


class MarketOutput(BaseModel):
    """은서 모듈의 최종 출력."""

    collected_at: datetime
    market_date: date
    daily_market_summary: str
    stock_data: dict[str, StockData]
    trending_keywords: list[TrendingKeyword] = Field(default_factory=list)
    raw_news: list[NewsItem] = Field(default_factory=list)
    market_topics: list[MarketTopic] = Field(default_factory=list)


class Holding(BaseModel):
    name: str
    ticker: str
    market: Market
    quantity: float
    avg_price: float
    currency: Literal["KRW", "USD"]


class Account(BaseModel):
    account_name: str
    cash_krw: float = 0
    cash_usd: float = 0
    holdings: list[Holding] = Field(default_factory=list)


class Portfolio(BaseModel):
    """현태 모듈의 입력 (사용자 포트폴리오)."""

    accounts: list[Account] = Field(default_factory=list)

    @field_validator("accounts")
    @classmethod
    def at_least_one_account(cls, v: list[Account]) -> list[Account]:
        if not v:
            raise ValueError("Portfolio must have at least one account")
        return v


class RiskMetrics(BaseModel):
    total_value_krw: float
    total_pnl_krw: float
    pnl_pct: float
    sector_concentration: dict[str, float] = Field(default_factory=dict)
    foreign_ratio: float = 0
    cash_ratio: float = 0


class AnalysisReport(BaseModel):
    """현태 모듈의 LLM 분석 리포트."""

    summary: str
    portfolio_type: str
    investor_match: str
    risks: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    market_context_note: str = ""
    disclaimer: str


class BacktestMetrics(BaseModel):
    cagr: float
    mdd: float
    sharpe: float
    total_return_pct: float


class BacktestResult(BaseModel):
    """현태 모듈의 백테스트 결과."""

    period_start: date
    period_end: date
    initial_amount: float
    portfolio_metrics: BacktestMetrics
    benchmark_metrics: dict[str, BacktestMetrics] = Field(default_factory=dict)
    chart_data: dict[str, list[float]] = Field(default_factory=dict)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime = Field(default_factory=datetime.now)


class ChatContext(BaseModel):
    """수빈 모듈이 LLM에 주입하는 컨텍스트."""

    market: MarketOutput | None = None
    portfolio_data: dict | None = None
    analysis_report: AnalysisReport | None = None
    history: list[ChatMessage] = Field(default_factory=list)
