# 아키텍처

## 한 줄 요약

`[은서: Market Intelligence] → [현태: Portfolio Analyzer] → [수빈: Coach Chat] → [web/UI]`

각 코어 모듈은 Python 패키지로 독립 개발합니다. 모듈 경계의 데이터 계약은 `shared/models.py`의 Pydantic 모델로 고정하고, 웹 UI는 API 연결 전까지 mock fallback으로 데모 안정성을 유지합니다.

## 시스템 레이어

```text
┌─────────────────────────────────────────────┐
│ web/ React + Vite UI                         │
│ - Dashboard / Portfolio / Chat / Learn       │
│ - API 실패 시 mock fallback 표시              │
└───────────────────────▲─────────────────────┘
                        │ API 또는 직접 통합
┌───────────────────────┴─────────────────────┐
│ coach_chat/ (수빈)                            │
│ - ChatContext 조립                            │
│ - LLM 답변 생성                               │
│ - QA 면책 문구 첨부                            │
└───────────────▲───────────────▲─────────────┘
                │               │
┌───────────────┴──────────┐ ┌──┴──────────────────────────┐
│ market_intelligence/      │ │ portfolio_analyzer/          │
│ (은서)                    │ │ (현태)                       │
│ - 주가/뉴스/트렌드 수집    │ │ - 포트폴리오 계산             │
│ - MarketOutput 반환       │ │ - 리포트/백테스트/차트 반환    │
└───────────────▲──────────┘ └──▲──────────────────────────┘
                │               │
┌───────────────┴───────────────┴─────────────┐
│ shared/ (병승)                               │
│ - Pydantic 데이터 계약                        │
│ - mocks / config / exceptions / disclaimers  │
└─────────────────────────────────────────────┘
```

## 모듈 책임

### shared/ (병승)

- 데이터 계약: `shared/models.py`
- mock 데이터: `shared/mocks.py`
- 환경설정: `shared/config.py`
- 공통 예외: `shared/exceptions.py`
- 면책 문구: `shared/disclaimers.py`

`shared/` 변경은 모든 팀원에게 영향을 주므로 ADR과 병승 리뷰가 필요합니다.

### market_intelligence/ (은서)

- 입력: 티커 리스트 예시 `['005930.KS', 'AAPL']`
- 출력: `shared.models.MarketOutput`
- 책임:
  - 한국/미국 주가 데이터 수집
  - 뉴스 RSS 수집 및 요약
  - 트렌드 키워드/시장 토픽 생성
  - 외부 API 실패 시 mock 또는 빈 결과로 안전하게 fallback
  - 반복 호출 비용을 줄이는 캐싱

### portfolio_analyzer/ (현태)

- 입력: 사용자 `Portfolio`, 은서의 `MarketOutput`
- 출력: 수빈/UI가 쓰는 4개 공개 함수
- 책임:
  - 포트폴리오 입력/관리
  - 종목명 → 티커 매칭
  - 평가금액/손익/비중 계산
  - 분석 리포트 생성
  - 백테스트와 벤치마크 비교
  - 차트 객체 반환

공개 함수:

```python
def get_portfolio_data() -> dict: ...
def get_analysis_report(force_refresh: bool = False) -> dict: ...
def get_backtest_result(period: str = "1y") -> dict: ...
def get_stock_chart(ticker: str, period: str = "1mo"): ...
```

### coach_chat/ (수빈)

- 입력: 은서의 `MarketOutput`, 현태의 포트폴리오 결과, 사용자 질문
- 출력: 사용자에게 보여줄 답변과 UI 대화 흐름
- 책임:
  - `ChatContext` 조립
  - 시스템 프롬프트 구성
  - LLM 답변 생성
  - 대화 히스토리 관리
  - 답변에 `QA_DISCLAIMER` 첨부
  - 직접 추천처럼 보이는 표현 차단

### web/ (공통 UI 스캐폴드)

- 스택: React 19 + Vite + TypeScript + Tailwind CSS + Vitest
- 현재 화면:
  - `/`: Dashboard
  - `/portfolio`: Portfolio
  - `/chat`: Chat
  - `/learn`: Learn
- API 기대 endpoint:
  - `GET /api/market/summary`
  - `GET /api/portfolio/summary`
- API 연결 전 또는 실패 시 mock 데이터를 명시적으로 표시합니다.

## 데이터 흐름

### 1. 시장 정보 흐름

```text
티커 리스트
  → market_intelligence.collect_market()
  → MarketOutput
  → portfolio_analyzer / coach_chat / web dashboard
```

### 2. 포트폴리오 분석 흐름

```text
사용자 Portfolio
  + MarketOutput
  → portfolio_analyzer
  → get_portfolio_data() / get_analysis_report() / get_backtest_result()
  → coach_chat / web portfolio dashboard
```

### 3. 대화 흐름

```text
사용자 질문
  → coach_chat.build_context(question)
  → ChatContext
  → LLM answer
  → QA_DISCLAIMER 첨부
  → web/chat 또는 Streamlit UI 렌더링
```

## 디렉토리

```text
fincoach/
├── shared/                  데이터 계약, mock, config, 면책
├── market_intelligence/     은서 모듈
├── portfolio_analyzer/      현태 모듈
├── coach_chat/              수빈 모듈
├── web/                     React/Vite UI 스캐폴드
├── tests/                   Python 계약/E2E 테스트
├── docs/
│   ├── ARCHITECTURE.md      이 문서
│   ├── INTERFACES.md        모듈 인터페이스 명세
│   ├── GIT_WORKFLOW.md      Git 워크플로우
│   ├── PR_REVIEW_PLAYBOOK.md PR 리뷰 체크리스트
│   ├── WEEK_1_TASKS.md      현재 주차 작업
│   ├── onboarding/          온보딩 문서
│   ├── team-instructions/   팀원별 배포용 지시문
│   ├── decisions/           ADR
│   ├── meetings/            회의록
│   └── daily-logs/          팀원별 일일 로그
├── .claude/                 Claude 명령/에이전트/훅
└── .github/                 CODEOWNERS, PR 템플릿, CI
```

## 외부 의존성

- Python 공통: pydantic, python-dotenv
- 개발 도구: pytest, ruff, mypy, pre-commit
- Market Intelligence 후보: pykrx, yfinance, feedparser, pytrends
- Portfolio Analyzer 후보: pandas, numpy, plotly, pykrx, yfinance, openai
- Coach Chat 후보: openai, anthropic, litellm, streamlit
- Web: React, Vite, TypeScript, Tailwind CSS, Vitest

## 비기능 요구사항

- 단일 사용자 데모용. 멀티유저/권한 관리는 P2입니다.
- 외부 API 실패 시 앱 전체가 죽지 않아야 합니다.
- API key와 개인 정보는 절대 커밋하지 않습니다.
- LLM 비용 절감을 위해 개발 단계는 mock 응답을 우선 사용합니다.
- 사용자 노출 답변에는 면책 문구가 필요합니다.
- 직접 추천처럼 읽히는 금융 표현은 PR에서 차단합니다.

## 인터페이스 변경 절차

1. 변경 필요성을 Issue 또는 ADR 초안으로 설명합니다.
2. 병승이 영향 범위를 확인합니다.
3. `shared/models.py`, `shared/mocks.py`, `docs/INTERFACES.md`, 테스트를 함께 갱신합니다.
4. 영향받는 모듈 owner에게 PR에서 명시적으로 알립니다.
5. CI와 리뷰를 통과한 뒤에만 반영합니다.
