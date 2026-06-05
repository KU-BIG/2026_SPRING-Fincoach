"""coach_chat FastAPI 서버 진입점.

실행:
  uvicorn api.main:app --reload --port 8000
"""

from api.main import app  # noqa: F401
