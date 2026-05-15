# FinCoach 킥오프

본 문서가 진입점. 단계별로 본인 가이드까지 이동할 것.

## 첫날 5분

1. 리포 클론
   ```bash
   git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
   cd fincoach
   ```
2. 환경 셋업: [docs/SETUP.md](SETUP.md)
3. 본인 온보딩 가이드
   - 은서: [docs/onboarding/eunseo.md](onboarding/eunseo.md)
   - 현태: [docs/onboarding/hyuntae.md](onboarding/hyuntae.md)
   - 수빈: [docs/onboarding/subin.md](onboarding/subin.md)
4. 본인 모듈 폴더의 `CLAUDE.md` 확인

## 첫 주 목표

- 환경 셋업 완료
- 첫 PR 1건 ([docs/WEEK_1_TASKS.md](WEEK_1_TASKS.md) 참조)
- 타 팀원 PR 1건 리뷰

## 핵심 룰 4가지

1. `main` 직접 push 금지. 작업은 `feature/{본인이름}-{기능}` 브랜치에서 수행
2. `shared/` 폴더 수정 금지 (공통 영역)
3. 타 모듈 폴더 수정 금지
4. 매수/매도 직접 추천 표현 금지 (법적 리스크)

## Claude 사용

리포 폴더에서 Claude 실행 시 `CLAUDE.md` 자동 로드됨. 모듈 폴더에서 실행 시 모듈별 룰까지 추가 로드.

매일 작업 종료:
```
claude /wrap-day
```
자동 커밋 + 푸시 + PR + 일일 로그 저장.

매일 작업 시작:
```
claude /start-day
```
전일 작업 컨텍스트 자동 복구.

## 블로커 발생 시

```
claude /ask "{질문}"
```
GitHub Issue 자동 생성. 병승이 답변.

## 모듈 내부 자율성

본인 모듈 내부의 프레임워크/라이브러리/구조는 모듈 owner 결정. 공통 영역은 모듈 간 인터페이스(`shared/`)와 안전 룰만 강제. 주요 결정은 `docs/decisions/`에 ADR로 기록.

## FAQ

[docs/FAQ.md](FAQ.md) 참조.

## 참고 문서

- [회의록](meetings/)
- [의사결정 기록(ADR)](decisions/)
- [아키텍처](ARCHITECTURE.md)
- [데이터 계약](INTERFACES.md)
- [Git 워크플로우](GIT_WORKFLOW.md)

## Telegram

봇 `@KUBIG_CONF3_bot` 운영 중. 그룹 채널 등록 시 별도 안내 예정.
