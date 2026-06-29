"""API 엔드포인트 테스트 (LLM 호출은 mock 처리)."""

import json as _json
from unittest.mock import patch

from fastapi.testclient import TestClient

from api.main import app
from shared.disclaimers import QA_DISCLAIMER

client = TestClient(app)


# ── /api/portfolio/summary ────────────────────────────────────────────────────


def test_portfolio_summary_200_and_keys():
    res = client.get("/api/portfolio/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_value_krw" in data
    assert "total_pnl_krw" in data
    assert "pnl_pct" in data
    assert "positions" in data
    assert isinstance(data["positions"], list)


def test_portfolio_summary_numeric_types():
    data = client.get("/api/portfolio/summary").json()
    assert isinstance(data["total_value_krw"], (int, float))
    assert isinstance(data["total_pnl_krw"], (int, float))
    assert isinstance(data["pnl_pct"], (int, float))


def test_portfolio_summary_positions_shape():
    """positions 각 항목이 웹(api.ts)이 기대하는 키를 갖는지 검증."""
    data = client.get("/api/portfolio/summary").json()
    for pos in data["positions"]:
        assert "ticker" in pos
        assert "name" in pos
        assert "weight" in pos
        assert "pnl_pct" in pos


# ── /api/portfolio/analysis ───────────────────────────────────────────────────

MOCK_ANALYSIS = {
    "summary": "기술주 중심의 성장 포트폴리오입니다.",
    "characteristics": ["기술주 비중 높음", "한미 혼합"],
    "strengths": ["AI 수혜 종목 보유"],
    "risks": ["단일 섹터 집중"],
    "suggestions": ["섹터 분산 검토"],
    "disclaimer": "본 분석은 정보 제공 목적입니다.",
}


def test_portfolio_analysis_200_and_keys():
    with patch("api.portfolio.get_analysis_report", return_value=MOCK_ANALYSIS):
        res = client.get("/api/portfolio/analysis")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "characteristics" in data
    assert "strengths" in data
    assert "risks" in data
    assert "suggestions" in data
    assert "disclaimer" in data


def test_portfolio_analysis_list_types():
    with patch("api.portfolio.get_analysis_report", return_value=MOCK_ANALYSIS):
        data = client.get("/api/portfolio/analysis").json()
    assert isinstance(data["characteristics"], list)
    assert isinstance(data["strengths"], list)
    assert isinstance(data["risks"], list)
    assert isinstance(data["suggestions"], list)


def test_portfolio_analysis_force_refresh():
    with patch("api.portfolio.get_analysis_report", return_value=MOCK_ANALYSIS) as mock_fn:
        client.get("/api/portfolio/analysis?force_refresh=true")
    mock_fn.assert_called_once_with(force_refresh=True)


# ── POST /api/portfolio/summary (유저 holdings) ─────────────────────────────

USER_HOLDINGS = [
    {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000},
    {"ticker": "AAPL", "name": "Apple", "shares": 5, "avg_price": 180},
]


def test_post_portfolio_summary_200_and_keys():
    res = client.post("/api/portfolio/summary", json={"holdings": USER_HOLDINGS})
    assert res.status_code == 200
    data = res.json()
    assert "total_value_krw" in data
    assert "total_pnl_krw" in data
    assert "pnl_pct" in data
    assert "positions" in data
    assert len(data["positions"]) == 2


def test_post_portfolio_summary_uses_user_data():
    """유저 holdings 기반 계산 — mock과 다른 값이 나와야 함."""
    demo = client.get("/api/portfolio/summary").json()
    user = client.post("/api/portfolio/summary", json={"holdings": USER_HOLDINGS}).json()
    # shares/avg_price가 다르므로 total_value_krw가 달라야 함
    assert user["total_value_krw"] != demo["total_value_krw"]


def test_post_portfolio_analysis_200_and_keys():
    with patch("api.portfolio.get_analysis_report", return_value=MOCK_ANALYSIS):
        res = client.post("/api/portfolio/analysis", json={"holdings": USER_HOLDINGS})
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "disclaimer" in data


def test_post_portfolio_empty_holdings():
    """빈 holdings 배열 → 200 (에러는 아님, mock fallback)."""
    res = client.post("/api/portfolio/summary", json={"holdings": []})
    assert res.status_code == 200


# ── /api/chat ─────────────────────────────────────────────────────────────────


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


_SAMPLE_HOLDINGS_PAYLOAD = [
    {"ticker": "005930.KS", "name": "삼성전자", "shares": 10, "avg_price": 70000, "currency": "KRW"},
]


def test_stream_holdings_passed_to_build_context():
    """holdings 페이로드가 build_context에 그대로 전달되는지 확인."""
    captured = {}

    def fake_build_context(question, history, holdings=None):
        captured["holdings"] = holdings
        from shared.models import ChatContext
        return ChatContext(market=None, portfolio_data=None, analysis_report=None, history=[])

    with patch("api.chat.build_context", side_effect=fake_build_context), \
            patch("api.chat._stream_llm", return_value=iter(["data: [DONE]\n\n"])), \
            client.stream("POST", "/api/chat/stream", json={
                "question": "내 종목 알려줘",
                "holdings": _SAMPLE_HOLDINGS_PAYLOAD,
            }) as res:
        assert res.status_code == 200

    assert captured["holdings"] is not None
    assert len(captured["holdings"]) == 1
    assert captured["holdings"][0]["ticker"] == "005930.KS"


def test_stream_empty_holdings_not_none():
    """holdings=[] (빈 배열)은 None으로 치환되지 않고 []로 build_context에 전달된다 (PR #138 버그픽스)."""
    captured = {}

    def fake_build_context(question, history, holdings=None):
        captured["holdings"] = holdings
        from shared.models import ChatContext
        return ChatContext(market=None, portfolio_data=None, analysis_report=None, history=[])

    with patch("api.chat.build_context", side_effect=fake_build_context), \
            patch("api.chat._stream_llm", return_value=iter(["data: [DONE]\n\n"])), \
            client.stream("POST", "/api/chat/stream", json={
                "question": "내 종목 알려줘",
                "holdings": [],
            }) as res:
        assert res.status_code == 200

    assert captured["holdings"] is not None
    assert captured["holdings"] == []


def test_stream_no_holdings_field_passes_none():
    """holdings 필드 없는 요청(비로그인)은 build_context에 None을 전달한다."""
    captured = {}

    def fake_build_context(question, history, holdings=None):
        captured["holdings"] = holdings
        from shared.models import ChatContext
        return ChatContext(market=None, portfolio_data=None, analysis_report=None, history=[])

    with patch("api.chat.build_context", side_effect=fake_build_context), \
            patch("api.chat._stream_llm", return_value=iter(["data: [DONE]\n\n"])), \
            client.stream("POST", "/api/chat/stream", json={"question": "안녕"}) as res:
        assert res.status_code == 200

    assert captured["holdings"] is None
