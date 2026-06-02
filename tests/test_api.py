"""Chat 엔드포인트 테스트 (LLM 호출은 mock 처리)."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from api.main import app

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
