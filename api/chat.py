"""Chat 라우터 — 수빈 영역. coach_chat 모듈 호출."""

from __future__ import annotations

import os

import anthropic
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from coach_chat.context_builder import build_context
from shared.disclaimers import QA_DISCLAIMER
from shared.models import ChatMessage, MarketOutput

load_dotenv()

router = APIRouter()


# ── 요청/응답 스키마 ────────────────────────────────────────────────────────

class MessageIn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[MessageIn] = []


class ChatResponse(BaseModel):
    answer: str
    market_date: str | None = None
    portfolio_loaded: bool = False


# ── 내부 헬퍼 ───────────────────────────────────────────────────────────────

def _build_system_prompt(market: MarketOutput | None, portfolio_loaded: bool) -> str:
    lines = [
        "너는 FinCoach야. 사용자의 포트폴리오와 시장 정보를 함께 이해하는 금융 AI 코치야.",
        "정보를 제공하고 금융 개념을 설명하되, 특정 종목의 매수/매도를 절대 추천하지 마.",
        "한국어로 답해. 친근하지만 신뢰감 있는 톤을 유지해.",
        "",
    ]

    if market:
        lines += [
            f"[시장 현황 — {market.market_date}]",
            market.daily_market_summary,
        ]
        if market.trending_keywords:
            kw = ", ".join(k.keyword for k in market.trending_keywords[:5])
            lines.append(f"트렌딩 키워드: {kw}")
        lines.append("")

    if portfolio_loaded:
        lines.append("[포트폴리오] 사용자 포트폴리오 데이터가 로드되어 있음.")
        lines.append("")

    return "\n".join(lines)


def _call_llm(system: str, history: list[MessageIn], question: str) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY가 설정되지 않았습니다.")

    client = anthropic.Anthropic(api_key=api_key)

    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model=os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001"),
        max_tokens=1024,
        system=system,
        messages=messages,
    )

    return response.content[0].text


# ── 엔드포인트 ─────────────────────────────────────────────────────────────

@router.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    history = [
        ChatMessage(role=m.role, content=m.content)  # type: ignore[arg-type]
        for m in req.history
    ]
    ctx = build_context(req.question, history)

    system = _build_system_prompt(ctx.market, ctx.portfolio_data is not None)
    raw_answer = _call_llm(system, req.history, req.question)
    answer_with_disclaimer = f"{raw_answer}\n\n---\n{QA_DISCLAIMER}"

    return ChatResponse(
        answer=answer_with_disclaimer,
        market_date=str(ctx.market.market_date) if ctx.market else None,
        portfolio_loaded=ctx.portfolio_data is not None,
    )
