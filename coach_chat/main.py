"""coach_chat FastAPI 서버 진입점.

실행:
  uvicorn coach_chat.main:app --reload --port 8000
"""

from coach_chat.api import app  # noqa: F401
