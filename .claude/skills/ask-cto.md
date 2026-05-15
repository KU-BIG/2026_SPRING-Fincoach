---
name: ask-cto
description: CTO(병승)에게 질문/리뷰 요청을 GitHub Issue로 자동 생성.
---

# /ask-cto

질문이 생기면 채팅에서 묻지 말고 이 명령으로 Issue 생성. 기록이 남아서 나중에 검색 가능.

## 동작

1. 사용자에게 무엇을 묻는지 입력받기
2. 컨텍스트 자동 첨부:
   - 현재 브랜치
   - 최근 커밋 3개
   - 변경 중인 파일
3. GitHub Issue 생성 (`question` 라벨, CTO assign)
4. Issue 링크 출력

## 구현

```bash
QUESTION="$1"
[ -z "$QUESTION" ] && { echo "질문 내용을 입력하세요"; exit 1; }

BRANCH=$(git rev-parse --abbrev-ref HEAD)
RECENT=$(git log --oneline -3)
CHANGED=$(git status --short)

BODY=$(cat <<EOF
## 질문
$QUESTION

## 컨텍스트
- 브랜치: \`$BRANCH\`
- 작업자: $(git config user.name)

## 최근 커밋
\`\`\`
$RECENT
\`\`\`

## 변경 중인 파일
\`\`\`
$CHANGED
\`\`\`
EOF
)

gh issue create \
  --title "[Q] $(echo $QUESTION | cut -c1-50)" \
  --body "$BODY" \
  --label "question" \
  --assignee "youdie006"
```

## 언제 쓰나

- 인터페이스 변경이 필요할 때
- 다른 사람 모듈에 의존하는 부분이 막힐 때
- 룰 어겨도 될지 애매할 때
- 기술 선택 (라이브러리, 패턴) 결정 필요할 때

## 언제 안 쓰나

- 단순 문법 질문 (LLM에게 직접)
- 본인 모듈 내부 구현 (본인 결정)
