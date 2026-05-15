# Git 워크플로우

주니어 + LLM 환경에 최적화. 사람 룰보다 자동화로 안전 확보.

## 브랜치 룰

- `main` - 보호됨. 직접 push 금지. 머지 전 CI 통과 + 1 리뷰 필수.
- `feature/{이름}-{기능}` - 모든 작업 브랜치. 예:
  - `feature/eunseo-stock-collector`
  - `feature/hyuntae-portfolio-input`
  - `feature/subin-chat-ui`

## 매일 흐름

```
오전:  claude /start-day      (어제 로그 + main 최신화 + 오늘 할 일)
작업:  (보통의 Claude 대화)
오후:  claude /wrap-day       (commit + push + PR + 일일 로그)
```

## PR 흐름

1. 브랜치에서 작업
2. `claude /wrap-day` 실행 (draft PR 자동 생성)
3. CI 돌면서 통과 확인 (ruff + pytest)
4. PR ready for review로 전환 (`gh pr ready`)
5. CODEOWNERS가 자동으로 리뷰 요청 (`shared/` 변경 시 CTO 자동)
6. 리뷰 받고 수정 사항 반영
7. 1 approval + CI 통과되면 본인이 squash & merge

## 커밋 메시지 규칙

```
[모듈] 한 줄 요약 (50자 이내)

상세 본문 (선택)
- 무엇이 바뀌었는지
- 왜 바꿨는지
```

모듈 prefix:
- `[market]` - market_intelligence
- `[portfolio]` - portfolio_analyzer
- `[chat]` - coach_chat
- `[shared]` - shared (CODEOWNERS 자동 라우팅)
- `[docs]` - docs/
- `[ci]` - .github/, .claude/, pyproject.toml

## 자동 차단되는 명령 (hook으로 막힘)

- `git push --force`, `git push -f`
- `git reset --hard`
- `git push origin main` (PR 통해서만 머지 가능)
- `rm -rf shared/` / `.github/` / `docs/`

이걸 우회하려고 LLM에게 시키지 마세요. hook이 명령을 차단합니다.

## main이 망가졌을 때 (드물지만 발생 가능)

CTO만 처리:

```bash
git checkout main
git pull
git revert <broken-commit>
git push   # main에 revert commit은 PR로 처리 필요. branch protection 확인.
```

## 머지 충돌

`/sync-main`이 일상적으로 rebase 해주므로 큰 충돌은 드물다. 발생하면:

```bash
git rebase --abort      # 안전하게 복귀
claude /ask-cto "{충돌 내용}"   # CTO에게 핑
```

## 일일 로그가 중요한 이유

매일 `docs/daily-logs/{본인}/{날짜}.md`에 작업 요약이 저장됨. 다음날 새 채팅 시작할 때 LLM이 이 로그를 먼저 읽어서 컨텍스트 복구. **이게 8주차 회의의 핵심 결정사항.**

## ADR (의사결정 기록)

기술 선택을 바꾸거나 `shared/`를 변경할 때는 `docs/decisions/`에 ADR 추가. 템플릿: [`docs/decisions/TEMPLATE.md`](decisions/TEMPLATE.md).

## CTO 부재 시

대리 에이전트 `cto-bot` 호출:

```
claude /cto-review 5         # PR #5 리뷰
claude /cto-review digest    # 데일리 디지스트
```

다만 머지 자체는 사람이 수행 (`cto-bot`은 GO/NO-GO 판단만).
