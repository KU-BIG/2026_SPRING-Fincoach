# CLAUDE.md - FinCoach 루트 컨텍스트

이 파일은 이 리포에서 Claude 세션이 시작될 때 자동 로드됩니다. 모든 팀원의 Claude가 이 룰을 따라야 합니다.

## 프로젝트 개요

FinCoach - 내 포트폴리오를 아는 AI 금융 코치. Python 3.11+, Streamlit 기반.

## 팀 구조와 모듈 소유권

- `shared/` - 병승 (CTO) 소유. 다른 팀원은 READ-ONLY
- `market_intelligence/` - 은서
- `portfolio_analyzer/` - 현태
- `coach_chat/` - 수빈
- `docs/`, `.github/`, `.claude/` - 병승 소유

각 모듈 폴더의 `CLAUDE.md`에 그 모듈 owner와 책임이 명시되어 있습니다.

## 절대 룰 (어기지 마)

1. **main 브랜치 직접 push 금지.** 항상 feature 브랜치에서 작업하고 PR 올려라. (branch protection으로 자동 차단)
2. **shared/ 수정은 CODEOWNERS 리뷰 필수.** CTO 리뷰가 자동으로 요청된다. 승인 받으면 본인이 머지해도 된다.
3. **다른 사람 모듈 폴더 수정 금지.** 예: 은서가 `portfolio_analyzer/` 수정 X.
4. **위험 git 명령 금지:** `git push --force`, `git push -f`, `git reset --hard`. hook으로 차단되어 있다.
5. **매수/매도 추천 표현 금지.** "정보 제공"으로만 작성. 법적 리스크.
6. **머지 전 CI 통과 + 1리뷰 필수.** branch protection으로 강제. 승인 후 본인이 squash & merge.

## 작업 시작 전

```
claude /sync-main      # main 최신화 + 내 브랜치 rebase
```

## 작업 끝낼 때

```
claude /wrap-day       # 자동 commit + push + PR 업데이트 + 일일 로그 저장
```

## 데이터 계약

모듈 간 데이터는 반드시 `shared/models.py`의 Pydantic 모델로 주고받는다. 임의의 dict로 주고받지 마라.

자세한 내용은 [docs/INTERFACES.md](docs/INTERFACES.md).

## 컨텍스트 관리 (8주차 회의 결정사항)

매일 작업 끝날 때 `docs/daily-logs/{이름}/{날짜}.md`에 자동 로그가 저장된다. 새 채팅 시작할 때 본인의 최근 로그를 먼저 읽어라:

```
cat docs/daily-logs/eunseo/$(ls docs/daily-logs/eunseo | tail -1)
```

## 커밋 메시지 컨벤션

```
[모듈] 한 줄 요약 (50자 이내)

- 무엇이 바뀌었는지
- 왜 바꿨는지
```

모듈 prefix: `[market]`, `[portfolio]`, `[chat]`, `[shared]`, `[docs]`, `[ci]`

## 의사결정 기록 (ADR)

기술 선택을 바꾸거나 인터페이스를 변경할 때는 `docs/decisions/`에 ADR 파일을 추가하라. 템플릿은 `docs/decisions/TEMPLATE.md`.

## 면책

이 프로젝트는 학습/시연용이며 투자 자문 서비스가 아닙니다. 사용자에게 노출되는 모든 분석에는 `shared/disclaimers.py`의 면책 문구가 포함되어야 합니다.
