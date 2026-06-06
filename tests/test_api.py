"""Chat 엔드포인트 테스트 (LLM 호출은 mock 처리)."""

import json as _json
from unittest.mock import patch

from fastapi.testclient import TestClient

from api.main import app
from shared.disclaimers import QA_DISCLAIMER

client = TestClient(app)


def test_chat_no_api_key_returns_503():
    with patch.dict("os.environ", {}, clear=True):
        res = client.post("/api/chat", json={"question": "안녕"})
    assert res.status_code == 503


def test_chat_returns_answer_with_disclaimer():
    mock_text = "삼성전자는 오늘 강세를 보이고 있습니다."

    with patch("api.chat._call_llm", return_value=mock_text):
        res = client.post("/api/chat", json={"question": "삼성전자 오늘 어때?"})

    assert res.status_code == 200
    data = res.json()
    assert mock_text in data["answer"]
    assert "FinCoach는 정보 제공 도구입니다" in data["answer"]
    assert data["portfolio_loaded"] is True
    assert data["market_date"] is not None


def test_chat_passes_history():
    history = [
        {"role": "user", "content": "이전 질문"},
        {"role": "assistant", "content": "이전 답변"},
    ]

    captured = {}

    def fake_call_llm(system, hist, question):
        captured["history_len"] = len(hist)
        return "답변"

    with patch("api.chat._call_llm", side_effect=fake_call_llm):
        res = client.post("/api/chat", json={"question": "다음 질문", "history": history})

    assert res.status_code == 200
    assert captured["history_len"] == 2


# ── 스트리밍 엔드포인트 ─────────────────────────────────────────────────────


def _collect_sse_from_stream(lines: list[str]) -> list[dict]:
    """SSE 라인 목록에서 data: 페이로드를 파싱해 반환."""
    events = []
    for line in lines:
        if not line.startswith("data: "):
            continue
        payload = line[6:]
        if payload == "[DONE]":
            break
        events.append(_json.loads(payload))
    return events


def test_stream_no_api_key_returns_demo_mode():
    with patch.dict("os.environ", {}, clear=True), \
            client.stream("POST", "/api/chat/stream", json={"question": "안녕"}) as res:
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]
        lines = list(res.iter_lines())
    events = _collect_sse_from_stream(lines)
    full = "".join(e.get("delta", "") for e in events)
    assert "데모 모드" in full
    assert "FinCoach는 정보 제공 도구입니다" in full


def test_stream_yields_tokens_and_disclaimer():
    chunks = ["안녕", "하세요", " 반갑습니다"]

    def fake_stream(system, history, question):
        for ch in chunks:
            yield f"data: {_json.dumps({'delta': ch}, ensure_ascii=False)}\n\n"
        disclaimer_delta = f"---\n{QA_DISCLAIMER}"
        yield f"data: {_json.dumps({'delta': disclaimer_delta}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    with patch("api.chat._stream_llm", side_effect=fake_stream), \
            client.stream("POST", "/api/chat/stream", json={"question": "안녕"}) as res:
        assert res.status_code == 200
        lines = list(res.iter_lines())

    events = _collect_sse_from_stream(lines)
    full = "".join(e.get("delta", "") for e in events)
    assert "안녕하세요 반갑습니다" in full
    assert "FinCoach는 정보 제공 도구입니다" in full
