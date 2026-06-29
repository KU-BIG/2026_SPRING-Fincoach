"""api.ratelimit.RateLimitMiddleware 단위 테스트 (#134).

실 LLM/마켓 경로를 타지 않도록 격리된 최소 앱에 미들웨어만 얹어 검증한다.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.ratelimit import RateLimitMiddleware


def _client(limit: int = 3, window: int = 60) -> TestClient:
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, limit=limit, window_seconds=window)

    @app.post("/api/chat/stream")
    def _chat() -> dict:  # LLM 엔드포인트 prefix — 제한 대상
        return {"ok": True}

    @app.get("/api/market/summary")
    def _market() -> dict:  # 비-LLM — 제한 제외
        return {"ok": True}

    return TestClient(app)


def test_llm_endpoint_blocked_after_limit() -> None:
    client = _client(limit=3)
    for _ in range(3):
        assert client.post("/api/chat/stream").status_code == 200
    resp = client.post("/api/chat/stream")
    assert resp.status_code == 429
    assert resp.headers.get("Retry-After") == "60"


def test_non_llm_endpoint_not_limited() -> None:
    client = _client(limit=2)
    for _ in range(5):
        assert client.get("/api/market/summary").status_code == 200


def test_rate_limit_is_per_ip() -> None:
    client = _client(limit=2)
    a = {"X-Forwarded-For": "1.1.1.1"}
    b = {"X-Forwarded-For": "2.2.2.2"}
    for _ in range(2):
        assert client.post("/api/chat/stream", headers=a).status_code == 200
    # 1.1.1.1 은 한도 초과
    assert client.post("/api/chat/stream", headers=a).status_code == 429
    # 2.2.2.2 는 별개 버킷 — 정상
    assert client.post("/api/chat/stream", headers=b).status_code == 200
