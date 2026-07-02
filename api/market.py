"""Market Intelligence 라우터 — /api/market/summary."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.auth import AuthUser, require_user
from market_intelligence import collect_market

router = APIRouter()

DEFAULT_TICKERS = ["005930.KS", "000660.KS", "AAPL", "NVDA"]


def _market_response(ticker_list: list[str]) -> dict:
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
    if not ticker_list:
        ticker_list = DEFAULT_TICKERS
    return _market_response(ticker_list)


class _HoldingItem(BaseModel):
    ticker: str


class _MarketHoldingsRequest(BaseModel):
    holdings: list[_HoldingItem] = []


@router.post("/api/market/summary")
def market_summary_for_holdings(
    req: _MarketHoldingsRequest,
    _user: AuthUser = Depends(require_user),
) -> dict:
    """로그인 유저 보유종목 기반 시장 요약.

    holdings가 없거나 비어있으면 DEFAULT_TICKERS로 fallback.
    """
    ticker_list = list(dict.fromkeys(h.ticker.strip().upper() for h in req.holdings if h.ticker.strip()))
    if not ticker_list:
        ticker_list = DEFAULT_TICKERS
    return _market_response(ticker_list)
