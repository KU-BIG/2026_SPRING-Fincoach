"""LLM 엔드포인트 IP 레이트리밋 — 비용/남용 방지 (#134).

순수 ASGI 미들웨어로 구현해 SSE(StreamingResponse)를 깨지 않는다. 허용 요청은
그대로 통과시키고, 한도 초과 시에만 429로 단락한다.

- 대상: LLM을 호출하는(=비용 발생) 엔드포인트만 (RATE_LIMITED_PREFIXES).
- 키: 클라이언트 IP. Render/Pages 프록시 뒤이므로 X-Forwarded-For 우선.
- 정책: 고정 윈도우. 윈도우(기본 60s)당 N회(기본 20회). env로 조정:
  RATE_LIMIT_LLM_PER_MIN, RATE_LIMIT_WINDOW_SEC.
- 한계: 인메모리 = 워커별 카운트. 단일 워커 MVP/데모에는 충분. 다중 워커/수평
  확장 시 Redis 등 공유 저장소로 교체 필요.

인증(Supabase JWT 검증)은 프론트가 Authorization 토큰을 보내야 동작하므로
web/ 변경이 필요한 cross-module 작업 — 별도 후속으로 분리한다(#134 코멘트 참조).
"""

from __future__ import annotations

import os
import time

from starlette.responses import JSONResponse

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

    def _client_ip(self, scope) -> str:
        for name, value in scope.get("headers", []):
            if name == b"x-forwarded-for":
                first = value.decode("latin-1").split(",")[0].strip()
                if first:
                    return first
        client = scope.get("client")
        return client[0] if client else "unknown"

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

        ip = self._client_ip(scope)
        if self._over_limit(ip, time.monotonic()):
            response = JSONResponse(
                {"detail": f"요청이 너무 많습니다. {self.window}초 후 다시 시도해 주세요."},
                status_code=429,
                headers={"Retry-After": str(self.window)},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
