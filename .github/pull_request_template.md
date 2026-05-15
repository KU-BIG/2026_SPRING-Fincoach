## 무엇을 했나요

<!-- 1-3 문장 요약 -->

## 왜 했나요

<!-- 어떤 문제/요청에 대응한 변경인지 -->

## 어떻게 테스트했나요

- [ ] 로컬에서 작동 확인
- [ ] 테스트 추가/갱신 (파일: `tests/...`)
- [ ] mock으로 통합 시나리오 검증
- [ ] (UI 변경 시) Streamlit에서 직접 확인

## 영향 범위

- [ ] 본인 모듈만 (`market_intelligence/` | `portfolio_analyzer/` | `coach_chat/`)
- [ ] `shared/` 변경 있음 → ADR 첨부: `docs/decisions/####-*.md`
- [ ] 다른 모듈에 영향 (구체적으로: )

## 체크리스트

- [ ] CLAUDE.md 룰 준수 (main 직접 push X, shared/ CODEOWNERS 거침)
- [ ] 매수/매도 추천 표현 없음
- [ ] LLM 출력 함수에 `shared.disclaimers.attach()` 호출
- [ ] 위험 git 명령 안 씀 (force push, reset --hard)
- [ ] 커밋 메시지 prefix 규칙 따름 (`[market]/[portfolio]/[chat]/[shared]/[docs]/[ci]`)

## 스크린샷 (UI 변경 시)

<!-- Streamlit 화면 캡처 -->

## 관련 Issue/노션

Closes #
노션:
