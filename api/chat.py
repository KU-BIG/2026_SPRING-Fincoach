"""Chat 라우터 — 수빈 영역. coach_chat 모듈 호출."""

from __future__ import annotations

import json
import os
from collections.abc import Generator
from typing import Literal

import anthropic
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.auth import AuthUser, require_user
from api.portfolio import HoldingIn
from coach_chat.context_builder import build_context
from shared.disclaimers import QA_DISCLAIMER
from shared.models import ChatMessage, MarketOutput

load_dotenv()

router = APIRouter()

# 입력 크기 상한 (M2) — 무제한 입력으로 프롬프트/토큰 비용을 태우는 것을 막는다.
_MAX_QUESTION_LEN = 2000
_MAX_CONTENT_LEN = 4000
_MAX_HISTORY_LEN = 20


# ── 요청/응답 스키마 ────────────────────────────────────────────────────────

class MessageIn(BaseModel):
    # role 을 bare str 로 두면 클라이언트가 ``role:"system"`` 히스토리를 주입해
    # 면책/no-매수매도 가드를 우회하는 프롬프트 인젝션(재일브레이크)이 가능하다.
    # 클라이언트가 보낼 수 있는 role 은 user/assistant 로만 제한한다. system 은
    # 서버가 _build_system_prompt 로만 넣는다 (H3).
    role: Literal["user", "assistant"]
    content: str = Field(max_length=_MAX_CONTENT_LEN)


class ChatRequest(BaseModel):
    question: str = Field(max_length=_MAX_QUESTION_LEN)
    history: list[MessageIn] = Field(default_factory=list, max_length=_MAX_HISTORY_LEN)
    # Cap the array: holdings feed context_builder -> fetch_stock_data + collect_market, so an
    # unbounded list is a fan-out DoS. Every other holdings input is capped; this one was not.
    holdings: list[HoldingIn] | None = Field(default=None, max_length=100)


class ChatResponse(BaseModel):
    answer: str
    market_date: str | None = None
    portfolio_loaded: bool = False


# ── 내부 헬퍼 ───────────────────────────────────────────────────────────────

def _build_system_prompt(market: MarketOutput | None, portfolio_data: dict | None) -> str:
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

    if portfolio_data:
        summary = portfolio_data.get("summary", {})
        positions = portfolio_data.get("positions", [])
        lines.append("[사용자 포트폴리오]")
        if summary:
            total = summary.get("total_value_krw", 0)
            pnl_pct = summary.get("pnl_pct", 0)
            lines.append(f"총 평가금액: {total:,.0f}원 (수익률 {pnl_pct:+.2f}%)")
        for p in positions:
            lines.append(
                f"- {p['name']} ({p['ticker']}): 비중 {p['weight']:.1f}%,"
                f" 수익률 {p['pnl_pct']:+.2f}%"
            )
        lines.append("")

    return "\n".join(lines)


def _build_messages(history: list[MessageIn], question: str) -> list[dict]:
    msgs = [{"role": m.role, "content": m.content} for m in history]
    msgs.append({"role": "user", "content": question})
    return msgs


def _call_llm(system: str, history: list[MessageIn], question: str) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY가 설정되지 않았습니다.")

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model=os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001"),
        max_tokens=1024,
        system=system,
        messages=_build_messages(history, question),
    )
    return response.content[0].text


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _stream_llm(
    system: str, history: list[MessageIn], question: str
) -> Generator[str, None, None]:
    """SSE 토큰 스트림. API 키 없으면 데모 메시지 반환.

    재시도 정책: 델타를 한 개라도 내보낸 뒤 스트림이 끊기면 재시도하지 않는다.
    클라이언트는 델타를 누적(acc += delta)하므로, 스트림을 처음부터 다시 돌리면
    이미 받은 토큰이 중복 재전송돼 "안녕하안녕하세요…" 같은 중복이 생긴다.
    그래서 재시도는 "델타 0개 상태의 초기 연결 실패"에만 허용하고, 이미 일부라도
    내보낸 뒤 끊기면 부분 응답을 유지한 채 에러 델타만 덧붙인다.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        demo = "[데모 모드] ANTHROPIC_API_KEY가 설정되지 않아 실제 LLM을 호출하지 않습니다."
        yield _sse({"delta": demo})
        yield _sse({"delta": f"\n\n---\n{QA_DISCLAIMER}"})
        yield "data: [DONE]\n\n"
        return

    client = anthropic.Anthropic(api_key=api_key)
    msgs = _build_messages(history, question)
    model = os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001")

    for attempt in range(2):
        emitted = False
        try:
            with client.messages.stream(
                model=model, max_tokens=1024, system=system, messages=msgs
            ) as stream:
                for text in stream.text_stream:
                    emitted = True
                    yield _sse({"delta": text})
            yield _sse({"delta": f"\n\n---\n{QA_DISCLAIMER}"})
            yield "data: [DONE]\n\n"
            return
        except Exception as exc:
            # Retry only a clean initial-connection failure (nothing emitted yet).
            # If we already streamed some deltas, restarting would duplicate them
            # on the client's accumulator — keep the partial and stop.
            if emitted or attempt == 1:
                yield _sse({"error": f"LLM 호출에 실패했습니다: {exc}"})
                yield "data: [DONE]\n\n"
                return


# ── 엔드포인트 ─────────────────────────────────────────────────────────────

@router.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, _user: AuthUser = Depends(require_user)) -> ChatResponse:
    history = [
        ChatMessage(role=m.role, content=m.content)  # type: ignore[arg-type]
        for m in req.history
    ]
    holdings = [h.model_dump() for h in req.holdings] if req.holdings is not None else None
    ctx = build_context(req.question, history, holdings=holdings)

    system = _build_system_prompt(ctx.market, ctx.portfolio_data)
    raw_answer = _call_llm(system, req.history, req.question)
    answer_with_disclaimer = f"{raw_answer}\n\n---\n{QA_DISCLAIMER}"

    return ChatResponse(
        answer=answer_with_disclaimer,
        market_date=str(ctx.market.market_date) if ctx.market else None,
        portfolio_loaded=ctx.portfolio_data is not None,
    )


@router.post("/api/chat/stream")
def chat_stream(
    req: ChatRequest, _user: AuthUser = Depends(require_user)
) -> StreamingResponse:
    history = [
        ChatMessage(role=m.role, content=m.content)  # type: ignore[arg-type]
        for m in req.history
    ]
    holdings = [h.model_dump() for h in req.holdings] if req.holdings is not None else None
    ctx = build_context(req.question, history, holdings=holdings)
    system = _build_system_prompt(ctx.market, ctx.portfolio_data)

    return StreamingResponse(
        _stream_llm(system, req.history, req.question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
