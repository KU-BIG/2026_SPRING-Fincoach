# CTO 운영 가이드 (병승 전용)

## 1회 셋업 (지금 해야 할 것)

### GitHub Branch Protection (필수)

https://github.com/youdie006/KUBIG_conf3/settings/branches → Add rule → `main`:

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Require review from Code Owners
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - 체크: `lint-and-test`
- [x] Require conversation resolution before merging
- [ ] Require signed commits (선택)
- [x] Restrict pushes that create matching branches
- [x] Allow force pushes: NEVER
- [x] Allow deletions: NEVER

### Merge 옵션 (Repository Settings)

https://github.com/youdie006/KUBIG_conf3/settings → General → Pull Requests:

- [x] Allow squash merging (ONLY)
- [ ] Allow merge commits (OFF)
- [ ] Allow rebase merging (OFF)
- [x] Automatically delete head branches

### 팀원 초대

https://github.com/youdie006/KUBIG_conf3/settings/access:

- 은서, 현태, 수빈을 collaborator로 (Write 권한)
- Admin은 본인만

### CODEOWNERS 갱신

`.github/CODEOWNERS`의 주석된 라인 갱신:

```
/market_intelligence/  @eunseo-실제깃허브유저명
/portfolio_analyzer/   @hyuntae-실제깃허브유저명
/coach_chat/           @subin-실제깃허브유저명
```

## 일일 루틴

### 아침 (10분)

```bash
cd ~/fincoach    # 또는 /mnt/d/MyProject/kubig_conf3
claude
```

Claude 세션에서:
```
claude /cto-review digest
```

→ cto-bot이 어제 활동 요약, 열린 PR 리스트, 액션 필요 항목 정리.

### PR 리뷰 (수시)

GitHub 알림 오면:

```
claude /cto-review {PR번호}
```

→ cto-bot이 1차 리뷰 코멘트 작성. 본인은 위에 최종 판단만 추가.

### 저녁 (선택)

```
claude /wrap-day
```

본인 작업도 일일 로그 남김.

## 주간 루틴

### 월요일 (킥오프)

- `docs/meetings/YYYY-MM-DD-week#.md` 새로 만들기
- 팀원별 이번 주 우선순위 정하기
- 노션 보드 보면서 막힌 거 미리 트리아지

### 목요일 (통합 데이, 3주차부터)

- `pytest tests/integration/ -v` 실행
- 모듈 간 mock 제거하고 실연결 시도
- 발견된 인터페이스 차이는 즉석 ADR 초안:
  ```
  claude /cto-review adr "{변경 내용}"
  ```

### 금요일 (회고)

- 한 주 PR 머지 수, 이슈 해결 수 정리
- `docs/retros/YYYY-MM-DD.md` 작성
- 다음 주 우선순위

## 인터페이스 변경 시

순서 엄수:

1. 변경 안 만들고 **먼저 ADR**
   ```
   claude /cto-review adr "{변경 내용}"
   ```
2. ADR PR로 올림 → 팀원도 리뷰
3. ADR 채택 후 코드 변경 PR
4. 영향 모듈 모두 같은 PR 또는 후속 PR로 갱신
5. `shared/mocks.py`, `tests/test_contracts.py` 갱신

## 비상 시

### main 빨간색 (CI 깨짐)

1. 어떤 PR이 깼는지 확인 (`gh run list --limit 5`)
2. 즉시 revert PR 만들거나, 빠른 fix PR
3. 빠른 fix가 30분 안 되면 revert가 정답

### 팀원 잠수 (3일 활동 없음)

```
claude /cto-review digest
```

활동 없는 사람 확인. 1:1 핑. 스코프 축소 합의.

### 외부 API 다운

`mock_market_output()` 등 mock으로 fallback. 시연 직전이면 mock 데이터만으로 데모.

## LLM 비용 관리

- dev mode (.env에 API 키 없음): mock 응답 자동
- 통합 테스트 시점부터 실 API
- 비용 폭주 시: `LLM_PROVIDER=mock` 환경변수로 강제 mock

## 데이터 보존 (회사형)

다음 폴더가 회사형 기록 보존 장치:

- `docs/decisions/` - ADR (왜 이렇게 짰는지)
- `docs/meetings/` - 회의록 (무엇을 합의했는지)
- `docs/daily-logs/` - 일일 로그 (누가 무엇을 했는지)
- `docs/retros/` - 주간 회고 (무엇이 잘 됐고 안 됐는지)
- `.github/PR` history - 코드 변경의 맥락
- `.github/Issues` history - 질문/버그/요청

모두 git에 들어가므로 영구 보존. PR 머지 시 squash로 깨끗한 history 유지.

## CTO 자신의 작업 비중

권장:
- 30% 본인 코딩 (shared, 통합 테스트)
- 40% PR 리뷰 + 팀원 언블락
- 20% 회의/문서/ADR
- 10% 기타

본인 코딩이 50% 넘어가면 리딩 못 한다는 신호.
