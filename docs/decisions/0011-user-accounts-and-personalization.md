# ADR 0011: User accounts and per-user personalization (Supabase)

- 날짜: 2026-06-14
- 상태: 채택됨 (Accepted)
- 결정자: 병승 (owner), 팀 합의 전제

## 컨텍스트

실서비스(`fincoach.bsghcal.com`)를 열었지만 `로그인`/`시작하기` 버튼이 placeholder이고
포트폴리오는 전원 공유 mock(`mock_portfolio()`)이라 데모와 동작이 같다. 실제 사용자가
가입해 자기 종목을 입력하고, 자기 채팅 기록을 가지려면 인증 + 유저별 데이터 저장이 필요하다.

제약:
- 프론트는 Cloudflare Pages, 백엔드는 Render(Python FastAPI). 정적 프론트라 서버 세션 불가.
- 데모(`fincoach-18i`)는 그대로 보존해야 한다.
- 유저별 데이터는 포트폴리오(현태)·채팅(수빈) 모듈 경계를 넘는다 → ADR 필요(룰 4).

## 결정

**Supabase(Auth + Postgres) 올인원**을 도입한다. 계정 하나로 인증과 유저별 DB를 처리하고,
Row Level Security(RLS)로 유저별 데이터 격리를 DB 레벨에서 강제한다.

- 인증: Supabase Auth(이메일/비번 시작, 이후 OAuth 추가 가능). 프론트 `@supabase/supabase-js`.
- 데이터: `holdings`(유저별 보유종목), `chat_messages`(유저별 채팅) 테이블 + RLS.
- 백엔드(FastAPI): Supabase JWT를 검증해 user_id를 얻고, 유저 holdings로 가격계산/분석/채팅.
- **env-gating**: `VITE_SUPABASE_URL`이 없으면(데모 빌드) 인증 비활성 → 데모는 기존 동작 유지.
  실서비스 빌드(`deploy-app.yml`)만 Supabase env를 주입해 인증 활성화.

## 결과

좋은 점:
- `로그인`/`시작하기`가 실제 가입·로그인으로 동작. 유저별 포트폴리오·채팅 보존.
- RLS로 유저 데이터 격리가 코드 실수와 무관하게 DB에서 보장됨.
- 계정/플랫폼 하나(Supabase)로 인증+DB 관리, 스프롤 최소.
- 데모는 env-gating으로 한 줄도 안 바뀜.

트레이드오프:
- 백엔드가 stateless 가정에서 유저 컨텍스트(JWT 검증 + holdings 조회)를 받게 됨.
- 현태/수빈 모듈이 mock 대신 유저 데이터를 쓰도록 단계적 개조 필요.
- secret(service) 키는 Render 환경변수에만 — 레포/프론트 절대 금지.

## 대안

- **Clerk(인증) + Supabase(DB)**: 인증 UX는 더 좋지만 계정 2개. 올인원이 관리 단순해 보류.
- **자체 인증(FastAPI + JWT + Postgres)**: 통제권은 크나 보안·메일·세션을 직접 구현해야 해 MVP에 과함.
- **인증 없이 로컬 저장(localStorage)**: 계정·기기간 동기화 불가 → 실서비스 요구 미달.

## 영향 범위

- [x] shared/ (유저/holdings 모델 추가 가능)
- [x] market_intelligence/ (영향 적음, 유저 종목으로 요약 — #43 tickers 파라미터 활용)
- [x] portfolio_analyzer/ (mock 대신 유저 holdings 입력 받도록)
- [x] coach_chat/ (채팅 기록 저장·복원)
- [x] docs/
- [x] .github/.claude/ (deploy-app.yml에 Supabase env)

## 후속 액션

- [x] DB 스키마(`supabase/schema.sql`): holdings, chat_messages + RLS
- [x] 프론트 인증 기반: supabase 클라이언트, AuthProvider, 로그인/가입 UI, Header 연동 (env-gated)
- [x] `deploy-app.yml`에 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 주입
- [ ] (다음 PR) 포트폴리오 입력→저장 폼 + 백엔드 유저 holdings 사용
- [ ] (다음 PR) 채팅 기록 Supabase 저장·복원
- [ ] (다음 PR) 백엔드 Supabase JWT 검증 + service 키는 Render 환경변수
- [ ] 팀 공지: 모듈별 유저화 범위 합의
