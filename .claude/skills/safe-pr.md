---
name: safe-pr
description: 안전한 PR 생성. 체크리스트 자동 채움 + 면책/테스트 검증.
---

# /safe-pr

PR을 안전하게 만듭니다. `wrap-day`가 자동 호출하지만 명시 호출도 가능.

## 사전 체크

1. 브랜치가 main이 아닌가?
2. CI 깨질만한 게 있나? (linter 통과 여부)
3. shared/ 변경이 있으면 ADR 추가됐는가?
4. `print()` 디버그 코드 안 남았는가?
5. 매수/매도 표현 (`매수`, `매도`, `buy`, `sell` 직접 추천) 없는가?
6. 면책 첨부됐는가? (LLM 출력 함수에 `disclaimers.attach()` 호출 있는지)

## PR 본문 자동 채움

```markdown
## 무엇을 했나요
{Claude가 git diff 보고 요약}

## 왜 했나요
{사용자 입력 또는 커밋 메시지에서 추출}

## 어떻게 테스트했나요
- [ ] 로컬에서 작동 확인
- [ ] 새 테스트 추가 ({파일명})
- [ ] mock으로 통합 시나리오 검증

## 영향 범위
- [ ] 본인 모듈만
- [ ] shared/ 변경 있음 (ADR: {링크})
- [ ] 다른 모듈 영향 있음 (어느 것: {})

## 체크리스트
- [ ] 매수/매도 추천 표현 없음
- [ ] LLM 출력에 면책 첨부
- [ ] CLAUDE.md 룰 준수
```

## 구현

```bash
# Pre-flight checks
ruff check . || { echo "linter 실패. fix 후 재시도"; exit 1; }
pytest tests/test_contracts.py -q || { echo "계약 테스트 실패"; exit 1; }

# 위험 표현 grep
git diff main --name-only | xargs grep -l -E "(매수|매도) 추천|recommend buy|recommend sell" 2>/dev/null && {
  echo "위험 표현 감지. '정보 제공' 톤으로 수정 후 재시도"
  exit 1
}

# PR 생성/업데이트
gh pr create --draft --title "$TITLE" --body-file .claude/pr-body.md
```
