# FinCoach 킥오프

환영. 이거 한 페이지부터 읽고 본인 파일로 이동하면 됩니다.

## 첫날 5분

1. 리포 클론
   ```bash
   git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
   cd fincoach
   ```
2. 환경 셋업 → [docs/SETUP.md](SETUP.md)
3. 본인 온보딩 가이드 열기
   - 은서: [docs/onboarding/eunseo.md](onboarding/eunseo.md)
   - 현태: [docs/onboarding/hyuntae.md](onboarding/hyuntae.md)
   - 수빈: [docs/onboarding/subin.md](onboarding/subin.md)
4. 본인 모듈 폴더의 `CLAUDE.md` 읽기

## 첫주 목표

- 환경 셋업 완료
- 본인 첫 PR 1개 올리기 ([docs/WEEK_1_TASKS.md](WEEK_1_TASKS.md) 참고)
- 다른 사람 PR 1개 리뷰 (서로 학습)

## 핵심 룰 4개

1. `main` 직접 push 금지. 항상 `feature/{본인이름}-{기능}` 브랜치
2. `shared/` 폴더 수정 금지 (CTO 영역)
3. 다른 사람 모듈 폴더 수정 금지
4. 매수/매도 직접 추천 표현 금지 (법적 리스크)

## Claude로 일할 때

각 폴더에 `CLAUDE.md`가 있어서 Claude를 이 리포에서 켜면 자동으로 룰을 학습합니다. 본인 모듈 폴더에서 켜면 본인 룰까지 함께 로드됩니다.

매일 작업 끝나면:

```
claude /wrap-day
```

→ 자동 커밋 + 푸시 + PR + 일일 로그 저장.

새 채팅 시작할 때:

```
claude /start-day
```

→ 어제 작업 컨텍스트 자동 복구.

## 막히면

```
claude /ask-cto "{질문}"
```

→ GitHub Issue로 자동 생성됨. CTO(병승)가 답변.

## 모듈 안에서는 자유

본인 모듈 안의 프레임워크, 라이브러리, 구조는 본인이 결정. CTO는 모듈 간 인터페이스(shared/)와 안전 룰만 강제. 큰 결정은 `docs/decisions/`에 ADR 남기면 좋음.

## 자주 묻는 것

[docs/FAQ.md](FAQ.md)

## 회의록/계획

- [회의록 모음](meetings/)
- [의사결정 기록(ADR)](decisions/)
- [아키텍처](ARCHITECTURE.md)
- [데이터 계약](INTERFACES.md)
- [Git 워크플로우](GIT_WORKFLOW.md)

## Telegram

CTO(병승)가 봇 운영 중. 본인이 알아야 할 정보는 CTO가 알려줍니다. 봇 채널 추가 안내 받으면 그대로 따라주세요.
