# ADR 0008: Coach Chat 프론트엔드 스택 — React + Vite + FastAPI

- 날짜: 2026-05-31
- 상태: 채택됨 (Accepted)
- 결정자: 수빈

## 컨텍스트

`coach_chat/main.py`는 빈 진입점으로 남겨져 있고, 수빈이 스택을 직접 결정하도록 위임되었다.
노션 MVP 명세에서 React + TypeScript + FastAPI 조합이 명시되어 있었고, 5주차 회의에서 단순화 논의가 있었으나 최종 결정은 수빈에게 위임되었다.

`web/`에 이미 React + Vite + TypeScript 프론트엔드 스캐폴드가 병승에 의해 세팅되어 있으며, 디자인 시스템(`DESIGN.md`)도 해당 스택 기반으로 정의되어 있다.

## 결정

**React + Vite (TypeScript) 프론트엔드 + FastAPI 백엔드**로 결정한다.

- 프론트엔드: `web/` 기존 스캐폴드 활용, 채팅 UI 페이지 추가
- 백엔드 API: `coach_chat/` 하위에 FastAPI 앱 작성 (`coach_chat/api.py`)
- LLM 클라이언트: Anthropic SDK (`anthropic`) 사용

## 결과

**좋은 점:**
- `web/`의 기존 디자인 시스템(Pretendard, 토큰 컬러)과 자동으로 일관성 유지
- 노션 MVP 명세와 일치하여 팀 기대에 부합
- `GET /api/market/summary`, `GET /api/portfolio/summary` 등 기존 API 기대 형태와 동일한 패턴으로 채팅 엔드포인트 추가 가능

**트레이드오프:**
- Streamlit 대비 초기 셋업 비용 높음
- FastAPI 서버와 Vite dev 서버를 함께 띄워야 함 (포트 두 개)

## 대안

| 대안 | 탈락 이유 |
|------|-----------|
| Streamlit | 기존 `web/` React 스캐폴드와 분리되어 디자인 불일치 |
| Next.js | `web/`가 이미 Vite 기반 — 불필요한 이중 프레임워크 |
| CLI | 팀 MVP 명세 목표(웹 UI 시연)와 부합하지 않음 |

## 영향 범위

- [ ] shared/
- [ ] market_intelligence/
- [ ] portfolio_analyzer/
- [x] coach_chat/
- [ ] docs/
- [ ] .github/.claude/

## 의존성 추가

이 결정으로 `pyproject.toml`에 아래 패키지가 추가됨:

| 패키지 | 용도 |
|--------|------|
| `anthropic>=0.105.2` | LLM 클라이언트 (Claude API) |
| `fastapi>=0.136.3` | 백엔드 API 서버 |
| `uvicorn[standard]>=0.48.0` | ASGI 서버 |
| `python-dotenv>=1.0` | `.env` 로드 (기존 의존성) |

## 후속 액션

- [x] `coach_chat/api.py` FastAPI 앱 작성 (채팅 엔드포인트 포함)
- [x] `coach_chat/context_builder.py` 작성 (`build_context` 함수)
- [x] `web/src/` 채팅 UI 페이지 추가
- [x] `pyproject.toml`에 fastapi, uvicorn, anthropic 의존성 추가
