"""Market Intelligence 라우터 — /api/market/summary."""

from __future__ import annotations

from fastapi import APIRouter

from market_intelligence import collect_market

router = APIRouter()

DEFAULT_TICKERS = ["005930.KS", "000660.KS", "AAPL", "NVDA"]


@router.get("/api/market/summary")
def market_summary() -> dict:
    output = collect_market(DEFAULT_TICKERS)
    return {
        "collected_at": output.collected_at.isoformat(),
        "market_date": output.market_date.isoformat(),
        "daily_market_summary": output.daily_market_summary,
        "trending_keywords": [k.model_dump() for k in output.trending_keywords],
    }
