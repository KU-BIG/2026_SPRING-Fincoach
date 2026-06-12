"""Portfolio 라우터. GET /api/portfolio/summary, GET /api/portfolio/analysis"""

from __future__ import annotations

from fastapi import APIRouter, Query

from portfolio_analyzer import get_analysis_report, get_portfolio_data

router = APIRouter()

# 메모리 캐시 — LLM 호출은 느리므로 1회 캐싱
_analysis_cache: dict | None = None


@router.get("/api/portfolio/summary")
def portfolio_summary() -> dict:
    data = get_portfolio_data()
    return {
        **data["summary"],
        "positions": data["positions"],
    }


@router.get("/api/portfolio/analysis")
def portfolio_analysis(force_refresh: bool = Query(default=False)) -> dict:
    global _analysis_cache
    if _analysis_cache is None or force_refresh:
        _analysis_cache = get_analysis_report(force_refresh=force_refresh)
    return _analysis_cache
