# FinCoach

내 포트폴리오를 아는 AI 금융 코치. KUBIG 컨퍼런스 3팀 프로젝트.

## 팀

- 병승 (CTO/총감독): 아키텍처, shared 모듈, 통합/리뷰
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

## 폴더

```
fincoach/
  shared/                  공통 모델/유틸 (CTO만 수정)
  market_intelligence/     은서
  portfolio_analyzer/      현태
  coach_chat/              수빈 + Streamlit 메인
  tests/                   계약 검증 + 통합 테스트
  docs/                    아키텍처/온보딩/회의록/의사결정
  .claude/skills/          팀 공용 자동화 스킬
```

## 문서

- [아키텍처](docs/ARCHITECTURE.md)
- [데이터 계약](docs/INTERFACES.md)
- [Git 워크플로우](docs/GIT_WORKFLOW.md)
- [의사결정 기록](docs/decisions/)
- [팀원별 온보딩](docs/onboarding/)

## 룰 한 줄 요약

1. main 직접 push 금지. 항상 `feature/{이름}-{기능}` 브랜치
2. `shared/` 수정은 CTO 승인 필수
3. 매수/매도 추천 표현 금지 (정보 제공만)
4. 작업 끝나면 `claude /wrap-day` 실행
