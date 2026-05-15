---
name: start-day
description: 하루 시작. 어제 로그 읽기 + main 최신화 + 오늘 할 일 정리. 채팅 시작할 때 실행.
---

# /start-day

새 채팅/새 세션에서 컨텍스트 복구하고 작업 준비합니다.

## 동작

1. 사용자 신원 감지 (`AUTHOR`)
2. `docs/daily-logs/$AUTHOR/` 최근 3일 로그 출력
3. `claude /sync-main` 호출
4. `git status`로 현재 상태 보여줌
5. 오늘 할 일 (어제 로그의 "다음 작업") 표시

## 구현

```bash
# 신원 감지 (wrap-day와 동일)
GIT_NAME=$(git config user.name)
case "$GIT_NAME" in
  *eunseo*|*은서*) AUTHOR="eunseo" ;;
  *hyuntae*|*현태*) AUTHOR="hyuntae" ;;
  *subin*|*수빈*) AUTHOR="subin" ;;
  *) AUTHOR="byungseung" ;;
esac

LOG_DIR="docs/daily-logs/$AUTHOR"

echo "=== 최근 3일 로그 ==="
if [ -d "$LOG_DIR" ]; then
  ls -1 "$LOG_DIR" | tail -3 | while read f; do
    echo "--- $f ---"
    cat "$LOG_DIR/$f"
    echo
  done
else
  echo "(첫 작업입니다)"
fi

echo "=== main 최신화 ==="
# /sync-main 로직 인라인 실행 또는 호출

echo "=== 현재 상태 ==="
git status -sb
git log --oneline -3

echo "=== 오늘 할 일 ==="
# 어제 로그에서 "다음 작업 (내일 할 것)" 섹션 추출
```

## 사용 예

```
claude /start-day
```
