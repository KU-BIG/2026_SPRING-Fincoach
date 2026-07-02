"""Shared pytest fixtures.

The rate-limit middleware keeps a process-global per-IP counter (``_hits``). The whole suite
hits the API from one TestClient IP, so once several endpoints are in RATE_LIMITED_PREFIXES the
counter accumulates across tests and unrelated tests start getting 429. Reset it before every
test so each starts from a clean bucket (rate-limit tests still exercise the limit with their
own in-test request volume).
"""

import pytest


@pytest.fixture(autouse=True)
def _reset_rate_limit_counter():
    from fastapi.testclient import TestClient

    from api.main import app
    from api.ratelimit import RateLimitMiddleware

    TestClient(app).get("/api/health")  # force the middleware stack to build so we can find it
    node = app.middleware_stack
    while node is not None:
        if isinstance(node, RateLimitMiddleware):
            node._hits.clear()
            break
        node = getattr(node, "app", None)
    yield
