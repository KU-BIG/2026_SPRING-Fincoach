# ADR 0005: LLM 페어 + CLAUDE.md 부트로더

- 날짜: 2026-05-15
- 상태: 채택됨 (Accepted)
- 결정자: 병승

## 컨텍스트

팀원이 대부분 Claude를 페어 프로그래머로 사용. 사람한테 "가이드 읽어와" 시키면 안 읽지만, LLM은 폴더 안 `CLAUDE.md`를 자동 로드한다. 5/14 8주차 회의에서 핵심 문제로 지목된 것: Claude context 한계 (새 채팅 시작하면 어제 작업 다 사라짐).

## 결정

1. **각 폴더에 `CLAUDE.md`** 배치 (루트, shared/, 3개 모듈)
   - LLM이 자동 로드 → 룰을 사람보다 잘 따름
2. **`docs/daily-logs/{본인}/{날짜}.md`** 자동 저장
   - `wrap-day` 스킬이 매일 작업 끝날 때 자동 생성
   - 다음 채팅 시작할 때 `start-day` 스킬이 자동 로드
3. **대리 에이전트** (`fincoach-bot`)
   - PR 리뷰, ADR 초안, 디지스트
4. **자동화 스킬** (`.claude/skills/`)
   - `sync-main`, `wrap-day`, `start-day`, `safe-pr`, `ask`, `review`

## 결과

- 좋은 점:
  - 컨텍스트 손실 문제 자동 해소.
  - 사람이 가이드 안 읽어도 LLM이 룰 적용.
  - 리뷰 시간 절약 (fincoach-bot이 1차 리뷰).
  - 일일 로그가 작업 기록 보존.
- 트레이드오프: Claude 의존도 높음. Claude 없으면 메뉴얼 작업.

## 대안

- 사람 가이드만 두기: 안 읽음. 기각.
- 외부 도구 (Slack 봇 등): 추가 인프라. 기각.
- pre-commit hook으로만 룰 강제: 검증은 되지만 LLM이 처음부터 룰 따르게 못 함. 기각.

## 영향 범위

- [x] 모든 폴더 (CLAUDE.md)
- [x] .claude/ (스킬, 에이전트, hooks)
- [x] docs/daily-logs/, docs/decisions/, docs/meetings/

## 후속 액션

- [x] CLAUDE.md 5개 작성 (루트 + 4개 폴더)
- [x] 스킬 6개 작성
- [x] fincoach-bot 에이전트 작성
