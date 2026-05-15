# ADR 0004: main 브랜치 보호 + Squash Merge

- 날짜: 2026-05-15
- 상태: 채택됨 (Accepted)
- 결정자: 병승

## 컨텍스트

처음 안: "PR 100-300줄 강제 + CTO 단독 머지". 하지만 팀원이 LLM에게 PR 짜라고 시킬 거라 사람 기준 룰은 friction만 만든다. CTO 단독 머지는 학습용 프로젝트에 과한 게이트킵.

## 결정

- `main` 브랜치 GitHub branch protection ON:
  - 직접 push 금지
  - CI 통과 필수
  - 1 approval 필수 (CODEOWNERS 자동 라우팅)
  - Conversation resolution 필수
- 머지 전략: **Squash & Merge만 허용** (history 깨끗하게)
- 머지 자체는 1 approval + CI 통과 후 **PR 작성자 본인이 클릭**

PR 크기 제한 없음. 스코프(논리적 단위 하나)는 권장.

## 결과

- 좋은 점:
  - CTO는 게이트가 아니라 리뷰어. 승인 = 신뢰.
  - 본인이 머지하면서 책임감 학습.
  - main 보호는 사람이 아니라 GitHub가.
  - history 깨끗 → bisect 쉬움.
- 트레이드오프: 머지 권한 분산. 실수 가능성. → CI + CODEOWNERS + protection으로 다층 방어.

## 대안

- CTO 단독 머지: 병목. 학습 효과 떨어짐. 기각.
- Merge commit 허용: history 지저분. 기각.
- Rebase merge: 충돌 잦을 가능성. 기각.

## 영향 범위

- [x] .github/
- [x] CLAUDE.md (룰 명시)
- [x] docs/GIT_WORKFLOW.md

## 후속 액션

- [x] CODEOWNERS 작성
- [x] CI workflow (ruff + pytest)
- [ ] GitHub UI에서 branch protection 룰 설정 (CTO 수동, repo admin 권한 필요)
