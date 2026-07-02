"""LLM 엔드포인트 레이트리밋 — 비용/남용 방지 (#134).

순수 ASGI 미들웨어로 구현해 SSE(StreamingResponse)를 깨지 않는다. 허용 요청은
그대로 통과시키고, 한도 초과 시에만 429로 단락한다.

- 대상: LLM을 호출하는(=비용 발생) 엔드포인트만 (RATE_LIMITED_PREFIXES).
- 키: 클라이언트 IP 만 사용한다.
    1) 신뢰 프록시가 전달한 클라이언트 IP — Cloudflare ``CF-Connecting-IP`` 등
       TRUSTED_CLIENT_IP_HEADERS 만 신뢰한다. 임의 조작 가능한
       X-Forwarded-For 는 신뢰하지 않는다.
    2) 소켓 peer IP (프록시 없는 로컬/직결).
- 왜 IP 만 쓰나: 이 미들웨어는 require_user(인증) 보다 먼저 실행된다. 여기서
  서명검증 안 된 JWT ``sub`` 를 버킷 키로 쓰면 공격자가 매 요청 ``sub`` 를 다르게
  위조해 매번 새 버킷을 얻어 레이트리밋을 우회하고, 각 요청이 require_user 에서
  Supabase ``/auth/v1/user`` 왕복(5s)을 유발해 Supabase 쿼터/스레드풀을 고갈시킨다.
  따라서 미인증 플러드가 Supabase 왕복 전에 IP 버킷으로 반드시 429에 걸리도록,
  미검증 토큰은 절대 버킷 키로 승격하지 않는다. 검증된 유저별 세분화가 필요하면
  require_user 이후 레이어에서 처리한다.
- 정책: 고정 윈도우. 윈도우(기본 60s)당 N회(기본 20회). env로 조정:
  RATE_LIMIT_LLM_PER_MIN, RATE_LIMIT_WINDOW_SEC.
- 한계: 인메모리 = 워커별 카운트. 단일 워커 MVP/데모에는 충분. 다중 워커/수평
  확장 시 Redis 등 공유 저장소로 교체 필요.
"""

from __future__ import annotations

import os
import time

from starlette.responses import JSONResponse

# Proxy-set client-IP headers we trust. Cloudflare's CF-Connecting-IP is set by
# Cloudflare itself and cannot be spoofed by the client (unlike X-Forwarded-For,
# which any client can forge). Add other trusted-proxy headers here if the
# fronting proxy changes.
TRUSTED_CLIENT_IP_HEADERS: tuple[bytes, ...] = (
    b"cf-connecting-ip",
    b"true-client-ip",
)

# 비용/자원을 태우는 엔드포인트 prefix만 제한.
RATE_LIMITED_PREFIXES: tuple[str, ...] = (
    "/api/chat",                # /api/chat, /api/chat/stream (LLM)
    "/api/portfolio/analysis",  # GET/POST 분석 (LLM)
    # GET /api/market/summary 는 데모 대시보드용으로 인증 없이 공개돼 있어
    # (require_user 없음) yfinance/pykrx 스레드풀을 직접 태운다. 티커 상한만으로는
    # 무토큰 동시 GET 플러드로 스레드풀을 고갈시킬 수 있으므로, 공개 경로를
    # 유지하되 IP 레이트리밋을 적용해 남용을 막는다 (#161/#162).
    "/api/market",              # GET /api/market/summary (외부 데이터 fetch)
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
        """Bucket key: the client IP only.

        We deliberately do NOT use the bearer token's JWT ``sub`` here. This
        middleware runs before authentication, so the token is unverified — an
        attacker could forge a fresh ``sub`` per request to mint a new bucket
        each time (rate-limit bypass) and pin the auth layer to a Supabase
        round-trip per request (DoS). Keying by IP means an unauthenticated
        flood is throttled here, before it can reach ``require_user``.
        """
        headers = scope.get("headers", [])

        # 1) Client IP from a trusted proxy header only (never raw XFF).
        for name, value in headers:
            if name in TRUSTED_CLIENT_IP_HEADERS:
                ip = value.decode("latin-1").split(",")[0].strip()
                if ip:
                    return f"ip:{ip}"

        # 2) Socket peer (no proxy in front — local/direct).
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
