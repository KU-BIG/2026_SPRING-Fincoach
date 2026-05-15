---
name: review
description: fincoach-bot 에이전트를 호출해 PR/코드/디지스트를 리뷰. 인자로 PR번호 또는 'digest' 또는 'adr <topic>' 전달.
---

# /review

대리 에이전트(`fincoach-bot`)를 호출합니다.

## 사용법

```
claude /review 5             # PR #5 리뷰
claude /review digest        # 오늘 데일리 디지스트
claude /review adr "Sector enum 추가"   # ADR 초안
claude /review integration   # 통합 테스트 + 보고
```

## 구현

`.claude/agents/fincoach-bot.md` 정의를 사용해 Task 툴로 fincoach-bot 에이전트 spawn:

```
Task(
  subagent_type="fincoach-bot",
  description="PR/digest/adr/integration 작업",
  prompt="{사용자 인자에 따른 구체 요청}"
)
```

## 언제 쓰나

- 본인 PR 머지 전 셀프 리뷰
- 다른 팀원 PR 머지 판단 (대리)
- 데일리 활동 요약
- 인터페이스 변경 ADR 초안

## 언제 안 쓰나

- 단순 구현 질문 (본인 Claude 세션)
- 머지 (사람이 직접 클릭)
- 룰 변경 (병승)
