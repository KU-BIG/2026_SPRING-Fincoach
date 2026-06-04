# ADR 0010: 배포 전략 — Cloudflare Pages + 로컬/터널 백엔드

- 날짜: 2026-06-04
- 상태: 채택됨 (Accepted)
- 결정자: 병승

## 컨텍스트

MVP 데모 + 외부 시연용 배포 필요. 도메인은 Cloudflare에 보유.

제약
- 백엔드는 FastAPI(Python). Cloudflare Workers는 Python 베타 단계라 풀스택 의존성(anthropic SDK, pykrx 등) 호환 불확실
- 백엔드 호스팅에 비용 추가 안 하고 싶음 (학습 프로젝트)
- 시연은 라이브 데모 형태도 가능 (강의실에서 직접 실행)

## 결정

프론트엔드와 백엔드 분리.

**프론트엔드**: Cloudflare Pages (`web/dist` 빌드 결과 배포)
- 도메인: 사용자 보유 도메인 연결
- 빌드: `npm run build` 자동 (GitHub Actions `deploy-web.yml`)
- SPA 라우팅: `_redirects`

**백엔드**: 단계별 진행
1. **개발/CI**: 로컬 `uvicorn api.main:app` (디폴트)
2. **데모 시연**: Cloudflare Tunnel로 로컬 백엔드 노출 (`cloudflared tunnel`) → 도메인 서브경로(`api.{도메인}`)로 라우팅
3. **상시 운영**: 추후 결정 (Render 무료 티어 후보)

CORS는 환경변수(`ALLOWED_ORIGINS`)로 받아 운영 도메인 추가.

## 결과

좋은 점
- Pages는 CDN + 즉시 글로벌 배포
- 백엔드는 LLM 비용/키 보호 위해 사용자 환경에서 통제
- 풀 호스팅 비용 0원 가능

트레이드오프
- 데모 시연 시 노트북/서버 켜져 있어야 함
- Tunnel 의존 (cloudflared 설치/관리)
- 상시 서비스 아님 — 시연 후 백엔드 내림

## 대안

| 대안 | 탈락 이유 |
|------|-----------|
| Cloudflare Workers Python 풀스택 | Python 베타, anthropic/pykrx 등 호환 불확실. MVP 일정 리스크 |
| Render/Railway 무료 티어 풀배포 | 무료 cold-start 15초+. 데모 인상 나쁨 |
| Vercel 풀배포 | Python 함수 제한 + LLM 응답 타임아웃 |
| 자체 VPS | 비용 + 운영 부담 |

## 영향 범위

- [x] web/ (VITE_API_BASE 환경변수 추가)
- [x] api/main.py (CORS ALLOWED_ORIGINS 환경변수화)
- [x] .env.example (배포 관련 변수 추가)
- [x] docs/DEPLOY.md (단계별 가이드)
- [x] .github/workflows/deploy-web.yml (이미 존재)

## 후속 액션

- [x] api/main.py CORS 환경변수화 (본 PR)
- [x] .env.example 갱신 (본 PR)
- [x] docs/DEPLOY.md 작성 (본 PR)
- [ ] Cloudflare 계정 Pages 프로젝트 `fincoach` 생성 (병승 수동, 외부 작업)
- [ ] GitHub Secrets 등록: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (병승 수동)
- [ ] 도메인 연결 (병승 수동)
- [ ] cloudflared 설치 + tunnel 셋업 (데모 직전)
