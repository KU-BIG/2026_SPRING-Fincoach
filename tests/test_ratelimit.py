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


def test_rate_limit_is_per_trusted_ip() -> None:
    # Keying is by the trusted-proxy header (CF-Connecting-IP), not raw XFF.
    client = _client(limit=2)
    a = {"CF-Connecting-IP": "1.1.1.1"}
    b = {"CF-Connecting-IP": "2.2.2.2"}
    for _ in range(2):
        assert client.post("/api/chat/stream", headers=a).status_code == 200
    # 1.1.1.1 은 한도 초과
    assert client.post("/api/chat/stream", headers=a).status_code == 429
    # 2.2.2.2 는 별개 버킷 — 정상
    assert client.post("/api/chat/stream", headers=b).status_code == 200


def test_rate_limit_ignores_spoofed_xff() -> None:
    """X-Forwarded-For 는 신뢰하지 않는다 — 매 요청마다 값을 바꿔도 같은
    버킷(소켓 peer)으로 묶여 한도가 적용돼야 한다 (스푸핑 우회 차단)."""
    client = _client(limit=2)
    for i in range(2):
        headers = {"X-Forwarded-For": f"9.9.9.{i}"}
        assert client.post("/api/chat/stream", headers=headers).status_code == 200
    # 새 XFF 값을 줘도 우회 불가 — 한도 초과
    assert (
        client.post("/api/chat/stream", headers={"X-Forwarded-For": "9.9.9.250"}).status_code
        == 429
    )


def test_rate_limit_is_per_user_token() -> None:
    """인증 토큰이 있으면 유저 id(JWT sub)로 버킷팅한다. 같은 IP라도 유저가
    다르면 별개 버킷이고, 같은 유저는 한도를 공유한다."""
    import base64
    import json as _json

    def _token(sub: str) -> str:
        def _b64(obj: dict) -> str:
            raw = _json.dumps(obj).encode()
            return base64.urlsafe_b64encode(raw).decode().rstrip("=")

        return f"{_b64({'alg': 'HS256'})}.{_b64({'sub': sub})}.sig"

    client = _client(limit=2)
    alice = {"Authorization": f"Bearer {_token('alice')}"}
    bob = {"Authorization": f"Bearer {_token('bob')}"}
    for _ in range(2):
        assert client.post("/api/chat/stream", headers=alice).status_code == 200
    # alice 한도 초과
    assert client.post("/api/chat/stream", headers=alice).status_code == 429
    # bob 는 별개 버킷
    assert client.post("/api/chat/stream", headers=bob).status_code == 200
