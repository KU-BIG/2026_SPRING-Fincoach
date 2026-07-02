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


def test_forged_jwt_sub_flood_is_blocked_by_ip(monkeypatch) -> None:
    """공격 재현→방어: 미인증 요청이 매번 서로 다른 위조 JWT sub 를 보내도,
    이 미들웨어는 (미검증) sub 를 버킷 키로 승격하지 않고 IP 로만 버킷팅하므로
    같은 소켓 peer 로 묶여 한도에 걸려야 한다. sub 별 버킷 승격이 있었다면
    무한히 우회돼 각 요청이 뒤단(require_user)의 Supabase 왕복을 유발했을 것이다.

    미들웨어가 unverified_sub 같은 토큰 파싱을 아예 호출하지 않는지도 함께
    확인해, 위조 sub 가 키 계산에 관여할 여지가 없음을 못박는다.
    """
    import base64
    import json as _json

    import api.ratelimit as rl

    def _forged_token(sub: str) -> str:
        def _b64(obj: dict) -> str:
            raw = _json.dumps(obj).encode()
            return base64.urlsafe_b64encode(raw).decode().rstrip("=")

        return f"{_b64({'alg': 'HS256'})}.{_b64({'sub': sub})}.forgedsig"

    # If any token-parsing helper is (re)introduced and called from the key path,
    # fail loudly — the whole point is that the unverified token never influences
    # the bucket key.
    if hasattr(rl, "unverified_sub"):
        monkeypatch.setattr(
            rl, "unverified_sub",
            lambda *_a, **_k: (_ for _ in ()).throw(
                AssertionError("rate-limit key must not parse the unverified token")
            ),
        )

    client = _client(limit=3)
    # Every request forges a different sub. All share one socket peer → one bucket.
    for i in range(3):
        headers = {"Authorization": f"Bearer {_forged_token(f'attacker-{i}')}"}
        assert client.post("/api/chat/stream", headers=headers).status_code == 200
    # 4th forged-sub request over the limit → 429 (bypass blocked before any
    # Supabase round-trip in require_user).
    over = {"Authorization": f"Bearer {_forged_token('attacker-999')}"}
    assert client.post("/api/chat/stream", headers=over).status_code == 429


def test_authenticated_requests_share_ip_bucket() -> None:
    """검증 전 단계라 유저별 버킷팅은 하지 않는다 — 같은 소켓 peer 의 요청은
    (서로 다른 유저 토큰이라도) 하나의 IP 버킷을 공유해 한도가 적용된다.
    유저별 세분화가 필요하면 require_user 이후 레이어에서 처리한다."""
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
    # alice + bob share the socket-peer IP bucket.
    assert client.post("/api/chat/stream", headers=alice).status_code == 200
    assert client.post("/api/chat/stream", headers=bob).status_code == 200
    # 3rd request (either user) over the shared IP limit → 429.
    assert client.post("/api/chat/stream", headers=alice).status_code == 429
