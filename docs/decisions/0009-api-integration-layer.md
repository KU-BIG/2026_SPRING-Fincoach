# ADR 0009: api/ 통합 레이어 분리

- 날짜: 2026-06-01
- 상태: 채택됨 (Accepted)
- 결정자: 병승

## 컨텍스트

PR #18에서 수빈이 `coach_chat/api.py` 안에 `/api/chat`뿐 아니라 `/api/market/summary`, `/api/portfolio/summary` 같은 타 모듈 엔드포인트까지 같이 정의함. 이는 통합 레이어라 모듈 단독 결정으로 두면 다음 문제가 발생함.

- 은서/현태 모듈 인터페이스 변경 시 수빈이 매번 동기화 부담
- 타 모듈 owner가 본인 엔드포인트를 추가할 자리가 없음
- 모듈 폴더 안에 다른 모듈 의존성이 섞임

## 결정

루트에 `api/` 폴더를 두고 owner별 파일로 라우터 분리.

```
api/
├── __init__.py
├── main.py          # FastAPI 앱, 라우터 등록, CORS, 공통 미들웨어
├── health.py        # GET /api/health (공통)
├── market.py        # 은서 영역. market_intelligence 호출
├── portfolio.py     # 현태 영역. portfolio_analyzer 호출
└── chat.py          # 수빈 영역. coach_chat 호출
```

엔드포인트 prefix는 모두 `/api/{영역}`. main.py에서 각 라우터를 `include_router` 로 조립.

owner 룰
- `api/market.py` → 은서 (PR 시 CODEOWNERS 라우팅 추가 권장)
- `api/portfolio.py` → 현태
- `api/chat.py` → 수빈
- `api/main.py`, `api/health.py` → 병승

각 owner는 본인 파일만 수정. 다른 owner 파일 수정 시 PR로 합의.

## 결과

좋은 점
- 책임 경계 명확. 인터페이스 변경 시 owner가 자기 파일만 갱신
- web 프론트는 `/api/{영역}` prefix만 기억하면 됨
- 통합 테스트 작성 자연스러움 (api.main을 import해서 TestClient)
- 모듈 폴더(`coach_chat/`, `market_intelligence/`)에 FastAPI 의존성 안 섞임

트레이드오프
- 파일이 더 분산됨 (단일 api.py 대비)
- 새 owner가 본인 라우터 파일 추가 + main.py에 register 한 줄 필요 (1회성)

## 대안

| 대안 | 탈락 이유 |
|------|-----------|
| 단일 `api/main.py`에 모든 엔드포인트 | owner 분리 안 됨, 충돌 잦음 |
| 모듈 폴더 안에 각자 api.py (`coach_chat/api.py`) | FastAPI 의존성이 모듈에 침투, 통합 entrypoint 모호 |
| 모듈 함수 직접 노출 (api 레이어 없음) | web에서 Python 호출 불가, CORS/인증 등 공통 처리 어려움 |

## 영향 범위

- [x] api/ (신규)
- [x] pyproject.toml (fastapi, uvicorn 추가)
- [x] README.md (백엔드 실행 안내)
- [ ] shared/
- [ ] 모듈 폴더 (이 PR에서 직접 수정 X. owner별 후속 PR)

## 후속 액션

- [x] api/ 폴더 + main.py + health.py 생성 (본 PR)
- [x] pyproject.toml 의존성 추가
- [x] 헬스체크 테스트
- [ ] 은서: api/market.py 추가 (후속 Issue)
- [ ] 현태: api/portfolio.py 추가 (후속 Issue)
- [ ] 수빈: PR #18 정리 → api/chat.py로 이동 (가이드 별도)
