# 모듈 인터페이스 명세

소스 오브 트루스: [`shared/models.py`](../shared/models.py). 이 문서는 사람이 읽기 좋은 요약본.

## 은서 (Market Intelligence) → 현태 + 수빈

### `MarketOutput` (Pydantic)

```python
class MarketOutput(BaseModel):
    collected_at: datetime
    market_date: date
    daily_market_summary: str        # 시장 브리핑 한 단락
    stock_data: dict[str, StockData] # 티커 → 가격/지표
    trending_keywords: list[TrendingKeyword]
    raw_news: list[NewsItem]
    market_topics: list[MarketTopic]
```

### `StockData`
```python
ticker: str          # "005930.KS" 또는 "AAPL"
name: str            # 한글 또는 영문 종목명
market: Market       # KR | US
date: date
close: float
change_pct: float
volume: int
return_5d: float | None
volatility_20d: float | None
```

### `NewsItem`
```python
title, link, source, summary: str
published_at: datetime
related_tickers: list[str]
related_keywords: list[str]
```

### 호출 패턴

```python
from market_intelligence.engine import collect_market

market: MarketOutput = collect_market(tickers=["005930.KS", "AAPL"])
```

## 현태 (Portfolio Analyzer) → 수빈

5/14 노션 결정대로 dict 반환 함수 4개 인터페이스:

```python
# 빠름, 항상 호출 OK
def get_portfolio_data() -> dict:
    return {
        "accounts": [...],
        "summary": {"total_value": ..., "total_pnl": ...},
        "errors": []
    }

# 느림, 분석 요청 시
def get_analysis_report(force_refresh: bool = False) -> dict:
    # AnalysisReport.model_dump() 결과
    ...

# 느림, 백테스트 요청 시
def get_backtest_result(period: str = "1y") -> dict:
    # BacktestResult.model_dump() + chart_figure
    ...

# 종목별 차트
def get_stock_chart(ticker: str, period: str = "1mo") -> plotly.graph_objs.Figure:
    ...
```

### 입력
- 사용자 입력: `Portfolio` Pydantic 객체
- 시장 데이터: 은서의 `MarketOutput`

### `Portfolio`
```python
class Account(BaseModel):
    account_name: str
    cash_krw: float
    cash_usd: float
    holdings: list[Holding]

class Holding(BaseModel):
    name: str            # 한글 종목명
    ticker: str          # "005930.KS"
    market: Market
    quantity: float
    avg_price: float
    currency: Literal["KRW", "USD"]

class Portfolio(BaseModel):
    accounts: list[Account]
```

## 수빈 (Coach Chat)

### `ChatContext`
```python
class ChatContext(BaseModel):
    market: MarketOutput | None
    portfolio_data: dict | None
    analysis_report: AnalysisReport | None
    history: list[ChatMessage]
```

### 호출 패턴
```python
from coach_chat.context_builder import build_context
from coach_chat.chat_engine import answer

ctx = build_context(question="삼성전자 오늘 어때?")
reply: str = answer(question, ctx)
```

## Mock 사용

다른 모듈 안 기다리고 개발할 때:

```python
from shared.mocks import (
    mock_market_output,      # 은서 출력
    mock_portfolio,          # 사용자 입력
    mock_analysis_report,    # 현태 출력
    mock_backtest_result,    # 현태 출력
)
```

## 인터페이스 변경 절차

1. `shared/models.py` 변경 안 만들고 **먼저 ADR 작성** (`docs/decisions/####-*.md`)
2. 병승 리뷰 받고 ADR 채택
3. ADR 채택 후 PR 올림 (코드 변경 + ADR 첨부)
4. CODEOWNERS가 병승에게 자동 리뷰 요청
5. 영향받는 다른 모듈도 같은 PR에서 함께 갱신
6. 모든 mock 갱신 (`shared/mocks.py`)
7. `tests/test_contracts.py` 갱신
