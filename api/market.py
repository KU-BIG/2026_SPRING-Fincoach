"""Market Intelligence 라우터 — /api/market/summary."""

from __future__ import annotations

from fastapi import APIRouter

from market_intelligence import collect_market

router = APIRouter()

DEFAULT_TICKERS = ["005930.KS", "000660.KS", "AAPL", "NVDA"]


@router.get("/api/market/summary")
def market_summary(tickers: str | None = None) -> dict:
    ticker_list = list(dict.fromkeys(t.strip().upper() for t in tickers.split(",") if t.strip())) if tickers else []
    if not ticker_list:
        ticker_list = DEFAULT_TICKERS

    output = collect_market(ticker_list)
    return {
        "collected_at": output.collected_at.isoformat(),
        "market_date": output.market_date.isoformat(),
        "daily_market_summary": output.daily_market_summary,
        "trending_keywords": [k.model_dump() for k in output.trending_keywords],
    }
