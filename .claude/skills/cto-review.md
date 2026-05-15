---
name: cto-review
description: cto-bot 에이전트를 호출해 PR/코드/디지스트를 리뷰. 인자로 PR번호 또는 'digest' 또는 'adr <topic>' 전달.
---

# /cto-review

CTO 대리 에이전트(`cto-bot`)를 호출합니다.

## 사용법

```
claude /cto-review 5             # PR #5 리뷰
claude /cto-review digest         # 오늘 데일리 디지스트
claude /cto-review adr "Sector enum 추가"   # ADR 초안
claude /cto-review integration   # 통합 테스트 + 보고
```

## 구현

이 스킬은 `.claude/agents/cto-bot.md` 정의를 사용해 Task 툴로 cto-bot 에이전트를 spawn합니다.

```
Task(
  subagent_type="cto-bot",
  description="PR/digest/adr/integration 작업",
  prompt="{사용자 인자에 따른 구체 요청}"
)
```

## 언제 쓰나

- 본인 PR 머지 전 셀프 리뷰 받고 싶을 때
- 다른 팀원 PR 머지 OK 판단 필요할 때 (CTO 대리)
- 데일리 스탠드업용 활동 요약 필요할 때
- 인터페이스 변경 ADR 초안 필요할 때

## 언제 안 쓰나

- 단순 구현 질문 (이건 본인 Claude 세션에서)
- 머지 자체 (이건 사람이 클릭)
- 룰 변경 (이건 병승에게)
