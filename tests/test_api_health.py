"""api.main FastAPI 앱 + 헬스체크 동작 확인."""

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_method_post_not_allowed():
    response = client.post("/api/health")
    assert response.status_code == 405
