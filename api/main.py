"""FastAPI 앱 엔트리포인트.

실행:
    uvicorn api.main:app --reload

각 owner 라우터 추가 패턴:
    from api import <owner>
    app.include_router(<owner>.router)
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import chat, health, market, portfolio
from api.ratelimit import RateLimitMiddleware


def _allowed_origins() -> list[str]:
    """ALLOWED_ORIGINS 환경변수에서 쉼표 구분 도메인 읽기. 비어있으면 dev 디폴트."""
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw:
        return ["http://localhost:5173"]
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="FinCoach API", version="0.1.0")

# 레이트리밋을 CORS보다 먼저 등록(=안쪽) → CORS가 바깥에서 429 응답까지 감싸야
# 브라우저가 429를 정상적으로 읽는다.
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(market.router)
app.include_router(portfolio.router)
