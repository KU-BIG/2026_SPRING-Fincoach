---
name: wrap-day
description: 하루 작업 마무리. 자동 commit + push + PR 업데이트 + 일일 로그 저장. 매일 작업 끝날 때 실행.
---

# /wrap-day

오늘 작업을 정리하고 깃에 안전하게 올립니다.

## 동작

1. 현재 브랜치/파일 변경 사항 요약
2. 변경된 모듈에 따라 적절한 commit 메시지 생성
3. commit + push
4. PR 없으면 draft PR 생성, 있으면 본문 업데이트
5. `docs/daily-logs/{본인}/{날짜}.md`에 오늘 한 일 정리

## 사용자 신원 자동 감지

```bash
GIT_NAME=$(git config user.name)
case "$GIT_NAME" in
  *eunseo*|*은서*) AUTHOR="eunseo" ;;
  *hyuntae*|*현태*) AUTHOR="hyuntae" ;;
  *subin*|*수빈*) AUTHOR="subin" ;;
  *byungseung*|*youdie*|*병승*) AUTHOR="byungseung" ;;
  *) AUTHOR="$(echo $GIT_NAME | tr ' ' '-' | tr '[:upper:]' '[:lower:]')" ;;
esac
```

## 구현 단계

```bash
# 1. 사전 체크
CURRENT=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT" = "main" ] && { echo "main 브랜치 직접 커밋 금지"; exit 1; }

# 2. 변경 확인
git status --short
[ -z "$(git status --porcelain)" ] && { echo "변경 사항 없음"; exit 0; }

# 3. 변경된 모듈 prefix 판별
CHANGED=$(git diff --name-only HEAD)
PREFIX=$(echo "$CHANGED" | head -1 | cut -d/ -f1 | sed 's|market_intelligence|market|;s|portfolio_analyzer|portfolio|;s|coach_chat|chat|')

# 4. Claude가 변경 사항 요약 → 커밋 메시지 생성
# (이 부분은 Claude가 git diff 보고 1줄 요약 + 본문 작성)

# 5. 커밋
git add -A
git commit -m "[$PREFIX] $SUMMARY

$BODY"

# 6. 푸시
git push -u origin "$CURRENT"

# 7. PR 생성/업데이트
if gh pr view --json url 2>/dev/null; then
  gh pr edit --body "$(cat .claude/pr-body.md)"
else
  gh pr create --draft --title "[$PREFIX] $SUMMARY" --body-file .claude/pr-body.md
fi

# 8. 일일 로그
DATE=$(date +%Y-%m-%d)
LOG_DIR="docs/daily-logs/$AUTHOR"
mkdir -p "$LOG_DIR"
cat > "$LOG_DIR/$DATE.md" <<EOF
# $AUTHOR 일일 로그 - $DATE

## 오늘 한 일
$WORK_SUMMARY

## 다음 작업 (내일 할 것)
$NEXT_TODO

## 막힌 것
$BLOCKERS

## 브랜치
$CURRENT

## 커밋
$(git log --oneline -5)
EOF

# 9. 일일 로그도 같이 커밋
git add "$LOG_DIR/$DATE.md"
git commit -m "[docs] $AUTHOR daily log $DATE" --no-verify
git push
```

## 일일 로그 형식

매일 같은 형식으로 저장 → 다음 채팅에서 컨텍스트 복구용:

- 오늘 한 일 (bullet)
- 다음 작업
- 막힌 것
- 현재 브랜치
- 최근 커밋

## 안전

- 위험 명령 안 씀 (push --force, reset --hard 금지)
- conflict 있으면 멈춤
- 일일 로그는 `--no-verify`로 hook 우회 (단, 코드 변경은 hook 필수 통과)
