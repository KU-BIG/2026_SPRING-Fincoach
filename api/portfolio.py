"""Portfolio 라우터.

GET  /api/portfolio/summary   — mock 데이터 (데모/비로그인)
GET  /api/portfolio/analysis  — mock 기반 LLM 분석 (데모/비로그인)
POST /api/portfolio/summary   — 유저 holdings 기반 실계산
POST /api/portfolio/analysis  — 유저 holdings 기반 LLM 분석
"""

from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from portfolio_analyzer import get_analysis_report, get_portfolio_data

router = APIRouter()

# 메모리 캐시 — LLM 호출은 느리므로 캐싱 (GET=데모용, POST=유저별)
_analysis_cache_demo: dict | None = None
_analysis_cache_user: dict[str, dict] = {}  # 캐시 키: holdings 해시


class HoldingIn(BaseModel):
    ticker: str
    name: str = ""
    shares: float = 0
    avg_price: float = 0
    currency: str = ""


class PortfolioRequest(BaseModel):
    holdings: list[HoldingIn]


# ── GET (데모/비로그인) ──────────────────────────────────────────────────────

@router.get("/api/portfolio/summary")
def portfolio_summary_demo() -> dict:
    data = get_portfolio_data()
    return {
        **data["summary"],
        "positions": data["positions"],
    }


@router.get("/api/portfolio/analysis")
def portfolio_analysis_demo(force_refresh: bool = Query(default=False)) -> dict:
    global _analysis_cache_demo
    if _analysis_cache_demo is None or force_refresh:
        _analysis_cache_demo = get_analysis_report(force_refresh=force_refresh)
    return _analysis_cache_demo


# ── POST (로그인 유저) ───────────────────────────────────────────────────────

@router.post("/api/portfolio/summary")
def portfolio_summary_user(req: PortfolioRequest) -> dict:
    holdings = [h.model_dump() for h in req.holdings]
    data = get_portfolio_data(holdings=holdings)
    return {
        **data["summary"],
        "positions": data["positions"],
    }


@router.post("/api/portfolio/analysis")
def portfolio_analysis_user(
    req: PortfolioRequest,
    force_refresh: bool = Query(default=False),
) -> dict:
    holdings = [h.model_dump() for h in req.holdings]
    # 유저별 캐시 키: ticker+수량+단가 조합 (수량/단가 변경 시 재분석)
    cache_key = ",".join(
        sorted(f"{h['ticker']}:{h.get('shares',0)}:{h.get('avg_price',0)}" for h in holdings)
    )

    if cache_key not in _analysis_cache_user or force_refresh:
        # 캐시 크기 제한 — OOM 방지
        if len(_analysis_cache_user) > 1000:
            _analysis_cache_user.clear()
        _analysis_cache_user[cache_key] = get_analysis_report(
            force_refresh=force_refresh,
            holdings=holdings,
        )
    return _analysis_cache_user[cache_key]
