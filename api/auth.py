"""Supabase JWT auth for the paid (LLM / compute) endpoints (#134).

Why this exists
    POST /api/chat, /api/chat/stream, /api/portfolio/analysis and
    /api/portfolio/summary trigger paid Anthropic calls or live price lookups.
    Without auth anyone can spend money on our behalf. This module gates those
    routes behind a valid Supabase user session.

How verification works (no JWT secret needed)
    We call Supabase's own userinfo endpoint:
        GET {SUPABASE_URL}/auth/v1/user
        Authorization: Bearer <access_token>
        apikey: <SUPABASE_ANON_KEY>
    Supabase validates the token signature/expiry and returns the user. The
    anon key is a public value (it already ships in the web bundle and is safe
    by design — per-user security is enforced by Postgres RLS, not by hiding
    the key), so no server secret is required. A 200 means the token is valid
    and gives us the user id; anything else is treated as unauthenticated.

    Verification results are cached per token for a short TTL so we don't make
    a Supabase round-trip on every request in a burst.

Demo / CI safety
    When SUPABASE_URL or SUPABASE_ANON_KEY is unset (local dev, CI, the public
    demo deployment), auth is DISABLED and require_user() returns an anonymous
    placeholder instead of 401. This keeps the offline test suite and the demo
    build working. In the real-service deployment both env vars are set (see
    render.yaml), so the paid routes are protected.
"""

from __future__ import annotations

import os
import threading
import time

import httpx
from fastapi import Header, HTTPException

# Per-token verification cache TTL. Short enough that a revoked/expired token
# stops working quickly, long enough to absorb a burst without hammering
# Supabase on every request.
_CACHE_TTL_SEC = 60.0
# Cap the cache so a flood of distinct tokens can't grow it without bound.
_MAX_CACHED_TOKENS = 10_000

# token -> (expires_at_monotonic, user_id).
# require_user() is a sync FastAPI dependency, so it runs in anyio's thread pool
# and multiple requests touch this dict concurrently. Guard every read/write with
# a lock: without it the len>cap eviction races (dict mutated during iteration)
# and two threads can both miss + both hit Supabase for the same token.
_verify_cache: dict[str, tuple[float, str]] = {}
_verify_cache_lock = threading.Lock()


class AuthUser:
    """Authenticated principal. ``anonymous`` is True only when auth is disabled
    (demo/CI: Supabase env not configured)."""

    __slots__ = ("id", "anonymous")

    def __init__(self, user_id: str, *, anonymous: bool = False) -> None:
        self.id = user_id
        self.anonymous = anonymous


def _supabase_env() -> tuple[str, str] | None:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    anon = os.getenv("SUPABASE_ANON_KEY", "").strip()
    if not url or not anon:
        return None
    return url, anon


def auth_enabled() -> bool:
    """True when Supabase env is configured (real service). False = demo/CI."""
    return _supabase_env() is not None


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


def _cache_get(token: str, now: float) -> str | None:
    with _verify_cache_lock:
        entry = _verify_cache.get(token)
        if entry is None:
            return None
        expires_at, user_id = entry
        if now >= expires_at:
            _verify_cache.pop(token, None)
            return None
        return user_id


def _cache_put(token: str, user_id: str, now: float) -> None:
    with _verify_cache_lock:
        if len(_verify_cache) > _MAX_CACHED_TOKENS:
            # Drop expired entries first; if still full, clear (bounded memory beats
            # perfect hit rate for a demo-scale service).
            for k, (exp, _uid) in list(_verify_cache.items()):
                if now >= exp:
                    _verify_cache.pop(k, None)
            if len(_verify_cache) > _MAX_CACHED_TOKENS:
                _verify_cache.clear()
        _verify_cache[token] = (now + _CACHE_TTL_SEC, user_id)


def _verify_with_supabase(token: str, url: str, anon: str) -> str | None:
    """Return the user id if Supabase accepts the token, else None."""
    try:
        resp = httpx.get(
            f"{url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": anon},
            timeout=5.0,
        )
    except httpx.HTTPError:
        # Network/transport failure: fail closed (treat as invalid). The client
        # can retry; we must not let an unverifiable token reach a paid call.
        return None
    if resp.status_code != 200:
        return None
    try:
        body = resp.json()
    except ValueError:
        return None
    user_id = body.get("id")
    return user_id if isinstance(user_id, str) and user_id else None


def require_user(authorization: str | None = Header(default=None)) -> AuthUser:
    """FastAPI dependency: require a valid Supabase session on paid routes.

    - Auth disabled (demo/CI): returns an anonymous AuthUser (no 401) so the
      offline tests and demo build keep working.
    - Auth enabled: a missing/malformed/invalid/expired token -> 401.
    """
    env = _supabase_env()
    if env is None:
        return AuthUser("anonymous", anonymous=True)

    token = _bearer_token(authorization)
    if token is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    now = time.monotonic()
    cached = _cache_get(token, now)
    if cached is not None:
        return AuthUser(cached)

    url, anon = env
    user_id = _verify_with_supabase(token, url, anon)
    if user_id is None:
        raise HTTPException(status_code=401, detail="유효하지 않은 인증입니다.")

    _cache_put(token, user_id, now)
    return AuthUser(user_id)
