"""FastAPI 앱 엔트리포인트.

실행:
    uvicorn api.main:app --reload

각 owner 라우터 추가 패턴:
    from api import <owner>
    app.include_router(<owner>.router)
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import chat, health

app = FastAPI(title="FinCoach API", version="0.1.0")

# web/ 개발 서버 + 향후 Cloudflare Pages 도메인은 환경변수로 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)

# owner별 라우터는 본인 PR에서 추가
# app.include_router(market.router)
# app.include_router(portfolio.router)
