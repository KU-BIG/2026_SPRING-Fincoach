# 의사결정 기록 (ADRs)

Architecture Decision Records. 기술 선택, 인터페이스 변경, 큰 트레이드오프를 여기에 기록.

## 왜 기록하나

- 6개월 뒤 "왜 이렇게 짰지?" 질문에 답하기 위해
- 새 팀원이 들어왔을 때 컨텍스트 빨리 잡기 위해
- 같은 논의를 반복 안 하기 위해

## 언제 ADR 만드나

- `shared/models.py` 변경
- 라이브러리 추가/교체
- 모듈 책임 변경
- 인터페이스 변경 (함수 시그니처)
- 외부 서비스 의존성 변경
- 회사형 룰 변경 (브랜치 전략, 머지 정책 등)

## 작성 방법

1. `TEMPLATE.md` 복사
2. 번호 매기기: `ls | grep -E '^[0-9]+' | tail -1` 다음 번호
3. 파일명: `####-짧은-제목.md`
4. PR로 올림 (CODEOWNERS가 CTO에게 자동 리뷰 요청)
5. 채택되면 상태 `Accepted`로 변경

## 자동 초안

```bash
claude /cto-review adr "Sector enum 추가"
```

cto-bot이 초안을 만들어줌. 본인이 편집해서 PR 올림.

## 목차

- [0001 - ADR 도입](0001-record-architecture-decisions.md)
- [0002 - 모듈 경계](0002-module-boundaries.md)
- [0003 - 데이터 계약은 Pydantic](0003-data-contracts-with-pydantic.md)
- [0004 - main 브랜치 보호 + Squash Merge](0004-branch-protection-and-squash-merge.md)
- [0005 - LLM 페어 + CLAUDE.md 부트로더](0005-claude-as-pair-with-claude-md.md)
- [0006 - 매수/매도 추천 금지](0006-no-buy-sell-recommendations.md)
- [0007 - 한국 주식은 pykrx](0007-pykrx-for-korean-stocks.md)
