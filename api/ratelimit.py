"""LLM 엔드포인트 레이트리밋 — 비용/남용 방지 (#134).

순수 ASGI 미들웨어로 구현해 SSE(StreamingResponse)를 깨지 않는다. 허용 요청은
그대로 통과시키고, 한도 초과 시에만 429로 단락한다.

- 대상: LLM을 호출하는(=비용 발생) 엔드포인트만 (RATE_LIMITED_PREFIXES).
- 키(우선순위):
    1) 인증 유저의 id — Authorization Bearer 토큰의 JWT ``sub`` 클레임.
       위조 불가: 유효하지 않은 토큰은 auth 의존성에서 401로 막히고, 진짜 토큰의
       ``sub`` 는 서명을 깨지 않고 바꿀 수 없다. IP 스푸핑(XFF)으로 우회되던
       기존 방식을 대체한다.
    2) 신뢰 프록시가 전달한 클라이언트 IP — Cloudflare ``CF-Connecting-IP`` 등
       TRUSTED_CLIENT_IP_HEADERS 만 신뢰한다. 임의 조작 가능한
       X-Forwarded-For 는 신뢰하지 않는다.
    3) 소켓 peer IP (프록시 없는 로컬/직결).
- 정책: 고정 윈도우. 윈도우(기본 60s)당 N회(기본 20회). env로 조정:
  RATE_LIMIT_LLM_PER_MIN, RATE_LIMIT_WINDOW_SEC.
- 한계: 인메모리 = 워커별 카운트. 단일 워커 MVP/데모에는 충분. 다중 워커/수평
  확장 시 Redis 등 공유 저장소로 교체 필요.
"""

from __future__ import annotations

import os
import time

from starlette.responses import JSONResponse

from api.auth import unverified_sub

# Proxy-set client-IP headers we trust. Cloudflare's CF-Connecting-IP is set by
# Cloudflare itself and cannot be spoofed by the client (unlike X-Forwarded-For,
# which any client can forge). Add other trusted-proxy headers here if the
# fronting proxy changes.
TRUSTED_CLIENT_IP_HEADERS: tuple[bytes, ...] = (
    b"cf-connecting-ip",
    b"true-client-ip",
)

# LLM을 호출하는(=비용 발생) 엔드포인트 prefix만 제한
RATE_LIMITED_PREFIXES: tuple[str, ...] = (
    "/api/chat",                # /api/chat, /api/chat/stream
    "/api/portfolio/analysis",  # GET/POST 분석 (LLM)
)

# IP 추적 딕셔너리 상한 — 초과 시 만료 항목 정리 (무한 증가 방지)
_MAX_TRACKED_IPS = 10_000


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return max(1, int(raw))
    except ValueError:
        return default


class RateLimitMiddleware:
    """고정 윈도우 IP 레이트리밋 (raw ASGI, SSE 안전)."""

    def __init__(
        self,
        app,
        *,
        limit: int | None = None,
        window_seconds: int | None = None,
    ) -> None:
        self.app = app
        self.limit = limit if limit is not None else _env_int("RATE_LIMIT_LLM_PER_MIN", 20)
        self.window = (
            window_seconds
            if window_seconds is not None
            else _env_int("RATE_LIMIT_WINDOW_SEC", 60)
        )
        # ip -> (window_start_monotonic, count)
        self._hits: dict[str, tuple[float, int]] = {}

    def _rate_key(self, scope) -> str:
        """Bucket key: authenticated user id first (spoof-proof), then a
        trusted-proxy client IP, then the socket peer IP."""
        headers = scope.get("headers", [])

        # 1) Authenticated user id from the bearer token's JWT `sub`.
        for name, value in headers:
            if name == b"authorization":
                auth = value.decode("latin-1")
                if auth[:7].lower() == "bearer ":
                    sub = unverified_sub(auth[7:].strip())
                    if sub:
                        return f"user:{sub}"
                break

        # 2) Client IP from a trusted proxy header only (never raw XFF).
        for name, value in headers:
            if name in TRUSTED_CLIENT_IP_HEADERS:
                ip = value.decode("latin-1").split(",")[0].strip()
                if ip:
                    return f"ip:{ip}"

        # 3) Socket peer (no proxy in front — local/direct).
        client = scope.get("client")
        return f"ip:{client[0]}" if client else "ip:unknown"

    def _over_limit(self, ip: str, now: float) -> bool:
        # 만료 항목 정리 (상한 초과 시에만 — 평상시 O(1))
        if len(self._hits) > _MAX_TRACKED_IPS:
            self._hits = {
                k: (s, c) for k, (s, c) in self._hits.items() if now - s < self.window
            }
        start, count = self._hits.get(ip, (now, 0))
        if now - start >= self.window:
            start, count = now, 0  # 윈도우 리셋
        count += 1
        self._hits[ip] = (start, count)
        return count > self.limit

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http" or not scope.get("path", "").startswith(
            RATE_LIMITED_PREFIXES
        ):
            await self.app(scope, receive, send)
            return

        key = self._rate_key(scope)
        if self._over_limit(key, time.monotonic()):
            response = JSONResponse(
                {"detail": f"요청이 너무 많습니다. {self.window}초 후 다시 시도해 주세요."},
                status_code=429,
                headers={"Retry-After": str(self.window)},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
