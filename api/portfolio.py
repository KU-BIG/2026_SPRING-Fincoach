"""Portfolio 라우터. GET /api/portfolio/summary"""

from __future__ import annotations

from fastapi import APIRouter

from portfolio_analyzer import get_portfolio_data

router = APIRouter()


@router.get("/api/portfolio/summary")
def portfolio_summary() -> dict:
    data = get_portfolio_data()
    return {
        **data["summary"],
        "positions": data["positions"],
    }
