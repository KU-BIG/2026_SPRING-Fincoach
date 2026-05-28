---
name: sync-main
description: main 브랜치 최신화 + 현재 작업 브랜치 rebase. 매 작업 시작 전 실행.
---

# /sync-main

main 최신화 후 현재 브랜치를 rebase합니다.

## 동작

1. 현재 브랜치 확인. main이면 중단 (main에서 직접 작업 금지)
2. `git fetch origin`
3. `git checkout main && git pull --ff-only origin main`
4. 원래 브랜치로 돌아가서 `git rebase main`
5. conflict 있으면 멈추고 사용자에게 해결 요청

## 안전

- 커밋되지 않은 변경 있으면 자동 stash → rebase → unstash
- rebase 실패 시 `git rebase --abort`로 복귀
- 절대 force push 안 함

## 사용 예

```
claude /sync-main
```

## 구현 (Claude가 따라야 할 단계)

```bash
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" = "main" ]; then
  echo "ERROR: main 브랜치에서는 작업하지 마세요. feature 브랜치로 이동 후 다시 실행."
  exit 1
fi

# 변경 사항 stash
STASH_NAME="sync-main-$(date +%s)"
git stash push -u -m "$STASH_NAME" 2>/dev/null

# main 최신화
git fetch origin
git checkout main
git pull --ff-only origin main || { echo "main pull 실패. 수동 확인 필요"; exit 1; }

# 원래 브랜치로 + rebase
git checkout "$CURRENT"
git rebase main || {
  echo "rebase 충돌 발생. 'git rebase --abort'로 복귀하거나 충돌 해결 후 'git rebase --continue'"
  exit 1
}

# stash 복원
git stash list | grep -q "$STASH_NAME" && git stash pop
echo "[OK] main 최신화 + $CURRENT rebase 완료"
```
