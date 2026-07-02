"""Portfolio 라우터.

GET  /api/portfolio/summary   — mock 데이터 (데모/비로그인)
GET  /api/portfolio/analysis  — mock 기반 LLM 분석 (데모/비로그인)
POST /api/portfolio/summary   — 유저 holdings 기반 실계산
POST /api/portfolio/analysis  — 유저 holdings 기반 LLM 분석
"""

from __future__ import annotations

import math
import threading

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ValidationError, field_validator

from api.auth import AuthUser, require_user
from portfolio_analyzer import get_analysis_report, get_portfolio_data

router = APIRouter()

# 메모리 캐시 — LLM 호출은 느리므로 캐싱 (GET=데모용, POST=유저별).
# 이 라우트 핸들러들은 sync def 라 anyio 스레드풀에서 병렬 실행된다. 락 없이
# "if 캐시 None → 대입" 사이에 다른 스레드가 끼어들면 두 스레드가 모두 miss 를
# 보고 같은 (유료) LLM 분석을 중복 호출한다. 락으로 check-compute-store 를
# 직렬화해 유료 호출이 키당 한 번만 일어나게 한다.
_analysis_cache_demo: dict | None = None
_analysis_cache_user: dict[str, dict] = {}  # 캐시 키: holdings 해시
_analysis_cache_lock = threading.Lock()


class HoldingIn(BaseModel):
    ticker: str
    name: str = ""
    shares: float = 0
    avg_price: float = 0
    currency: str = ""

    @field_validator("shares", "avg_price")
    @classmethod
    def _finite_and_non_negative(cls, v: float) -> float:
        # Pydantic accepts NaN/Infinity and negatives for a bare float. Left unchecked,
        # NaN/Inf reach calculator.round() and raise (a 500) and negatives silently
        # produce wrong values. Reject at the API boundary so the client gets a 422.
        if not math.isfinite(v) or v < 0:
            raise ValueError("must be a finite, non-negative number")
        return v


class PortfolioRequest(BaseModel):
    holdings: list[HoldingIn]


async def _parse_portfolio_request(request: Request) -> PortfolioRequest:
    """Parse and validate the request body into a PortfolioRequest, returning 422 on
    bad input.

    We take the raw Request instead of binding PortfolioRequest as a parameter so that
    a non-finite float (NaN/Infinity) never reaches FastAPI's default validation error
    body: that body echoes the offending input and is rendered with allow_nan=False,
    which turns a would-be 422 into a 500. Parsing here lets us reject with a clean,
    JSON-serializable 422 message.
    """
    try:
        payload = await request.json()
    except Exception as exc:  # malformed JSON body
        raise HTTPException(status_code=422, detail="Invalid JSON body") from exc
    try:
        return PortfolioRequest.model_validate(payload)
    except ValidationError as exc:
        # Build a payload free of non-finite float inputs so the 422 always serializes.
        errors = [
            {"loc": list(e.get("loc", ())), "msg": e.get("msg", "invalid value")}
            for e in exc.errors()
        ]
        raise HTTPException(status_code=422, detail=errors) from exc


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
    # Serialize the check-compute-store so concurrent misses don't both invoke
    # the (paid) LLM. The report call happens inside the lock: for the demo path
    # it's a single shared cache slot, so a brief serialization is acceptable and
    # avoids duplicate paid calls.
    with _analysis_cache_lock:
        if _analysis_cache_demo is None or force_refresh:
            _analysis_cache_demo = get_analysis_report(force_refresh=force_refresh)
        return _analysis_cache_demo


# ── POST (로그인 유저) ───────────────────────────────────────────────────────

@router.post("/api/portfolio/summary")
async def portfolio_summary_user(
    request: Request, _user: AuthUser = Depends(require_user)
) -> dict:
    req = await _parse_portfolio_request(request)
    holdings = [h.model_dump() for h in req.holdings]
    data = get_portfolio_data(holdings=holdings)
    return {
        **data["summary"],
        "positions": data["positions"],
    }


@router.post("/api/portfolio/analysis")
async def portfolio_analysis_user(
    request: Request,
    force_refresh: bool = Query(default=False),
    _user: AuthUser = Depends(require_user),
) -> dict:
    req = await _parse_portfolio_request(request)
    holdings = [h.model_dump() for h in req.holdings]
    # 유저별 캐시 키: ticker+수량+단가+통화 조합 (변경 시 재분석).
    # currency를 포함해야 통화만 다른 요청이 같은 키로 충돌하지 않는다
    # (KR 티커는 서버가 KRW로 강제하지만 US 티커는 통화가 값에 영향을 준다).
    cache_key = ",".join(
        sorted(
            f"{h['ticker']}:{h.get('shares', 0)}:{h.get('avg_price', 0)}:{h.get('currency', '')}"
            for h in holdings
        )
    )

    # Serialize under the shared cache lock so concurrent requests for the same
    # cache_key don't both make the paid LLM call, and the size-cap clear doesn't
    # race a concurrent read/write.
    with _analysis_cache_lock:
        if cache_key not in _analysis_cache_user or force_refresh:
            # 캐시 크기 제한 — OOM 방지
            if len(_analysis_cache_user) > 1000:
                _analysis_cache_user.clear()
            _analysis_cache_user[cache_key] = get_analysis_report(
                force_refresh=force_refresh,
                holdings=holdings,
            )
        return _analysis_cache_user[cache_key]
