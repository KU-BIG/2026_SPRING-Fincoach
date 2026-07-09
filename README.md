# FinCoach

내 포트폴리오를 아는 AI 금융 코치. KUBIG 컨퍼런스 3팀 프로젝트.

## 이 repo에 대해

이 repo는 [youdie006/KUBIG_conf3](https://github.com/youdie006/KUBIG_conf3)를 제출 시점 기준으로 `git push --mirror`한 아카이브 복제본입니다. 전체 브랜치와 커밋 히스토리(작성자, 날짜 포함)는 그대로 보존되어 있습니다.

- **포함되지 않은 것**: PR, Issue, Wiki (git 데이터가 아니라 mirror 대상이 아님)
- **실제 개발은 원본 repo에서 계속됩니다.** 이 repo는 특정 시점의 스냅샷이며 이후 업데이트되지 않습니다.
- PR/Issue 논의 기록이 필요하면 원본 repo를 참고해주세요.

## 팀

- 병승: 아키텍처, shared 모듈, 통합/리뷰
- 은서: Market Intelligence (`market_intelligence/`)
- 현태: Portfolio Analyzer (`portfolio_analyzer/`)
- 수빈: Coach Chat (`coach_chat/`)

## 시작하기

```bash
git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
cd fincoach
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
```

Claude 사용자는 이 폴더에서 Claude 켜면 됩니다. `CLAUDE.md`가 자동 로드되어 룰을 알려줍니다.

## 실행

```bash
# 백엔드 API (포트 8000)
uvicorn api.main:app --reload

# 프론트엔드 (별도 터미널, 포트 5173)
cd web && npm install && npm run dev
```

API 헬스체크: `http://localhost:8000/api/health`

## 폴더

```
fincoach/
  shared/                  공통 모델/유틸 (병승만 수정)
  market_intelligence/     은서
  portfolio_analyzer/      현태
  coach_chat/              수빈
  api/                     통합 레이어 (owner별 라우터)
  web/                     React + Vite 프론트엔드
  tests/                   계약 검증 + 통합 테스트
  docs/                    아키텍처/온보딩/회의록/의사결정
  .claude/commands/        팀 공용 자동화 명령
```

## 문서

- [아키텍처](docs/ARCHITECTURE.md)
- [데이터 계약](docs/INTERFACES.md)
- [Git 워크플로우](docs/GIT_WORKFLOW.md)
- [의사결정 기록](docs/decisions/)
- [팀원별 온보딩](docs/onboarding/)

## 룰 한 줄 요약

1. main 직접 push 금지. 항상 `feature/{이름}-{기능}` 브랜치
2. `shared/` 수정은 병승 승인 필수
3. 매수/매도 추천 표현 금지 (정보 제공만)
4. 작업 끝나면 `claude /wrap-day` 실행
