"""Market Intelligence 라우터 — /api/market/summary."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.auth import AuthUser, require_user
from market_intelligence import collect_market

router = APIRouter()

DEFAULT_TICKERS = ["005930.KS", "000660.KS", "AAPL", "NVDA"]

# Cap the tickers one request may resolve. Each ticker triggers an external yfinance/pykrx
# fetch on a worker thread; an unbounded list (GET ?tickers=T1,...,T2000, or a POST holdings
# body with thousands of items) would fan out to thousands of blocking fetches per request,
# exhausting the thread pool and risking a yfinance ban. The IP rate limit
# (RATE_LIMITED_PREFIXES) throttles request volume; this caps per-request fan-out. Applied in
# the shared helper so both GET and POST are covered. 50 comfortably fits a real portfolio;
# over the cap -> 422 rather than a silent truncation so the caller knows the request was large.
MAX_TICKERS = 50


def _market_response(ticker_list: list[str]) -> dict:
    if len(ticker_list) > MAX_TICKERS:
        raise HTTPException(status_code=422, detail=f"한 번에 최대 {MAX_TICKERS}개 종목까지 조회할 수 있습니다.")
    if not ticker_list:
        ticker_list = DEFAULT_TICKERS
    output = collect_market(ticker_list)
    return {
        "collected_at": output.collected_at.isoformat(),
        "market_date": output.market_date.isoformat(),
        "daily_market_summary": output.daily_market_summary,
        "trending_keywords": [k.model_dump() for k in output.trending_keywords],
    }


@router.get("/api/market/summary")
def market_summary(tickers: str | None = None) -> dict:
    ticker_list = list(dict.fromkeys(t.strip().upper() for t in tickers.split(",") if t.strip())) if tickers else []
    return _market_response(ticker_list)


class _HoldingItem(BaseModel):
    ticker: str = Field(max_length=30)


class _MarketHoldingsRequest(BaseModel):
    holdings: list[_HoldingItem] = Field(default_factory=list, max_length=200)


@router.post("/api/market/summary")
def market_summary_for_holdings(
    req: _MarketHoldingsRequest,
    _user: AuthUser = Depends(require_user),
) -> dict:
    """로그인 유저 보유종목 기반 시장 요약.

    holdings가 없거나 비어있으면 DEFAULT_TICKERS로 fallback.
    """
    ticker_list = list(dict.fromkeys(h.ticker.strip().upper() for h in req.holdings if h.ticker.strip()))
    return _market_response(ticker_list)
