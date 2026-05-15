# 아키텍처

## 한 줄 요약

`[은서: Market Intelligence] → [현태: Portfolio Analyzer] → [수빈: Coach Chat]`

각 모듈은 Python 패키지로 독립 개발. 인터페이스는 `shared/models.py`의 Pydantic 모델로 못박음. Streamlit 메인 앱이 통합.

## 모듈 책임

### shared/ (병승, CTO)
- 데이터 계약 (Pydantic 모델)
- mock 데이터 (개발 중 다른 모듈 안 기다리고 진행 가능하게)
- 환경설정, 면책, 공통 예외

### market_intelligence/ (은서)
- 주가 데이터: `pykrx` (한국) + `yfinance` (미국)
- 뉴스: RSS + `feedparser`
- 트렌드: `pytrends` 또는 네이버 데이터랩
- LLM 요약: 시장 브리핑 + 토픽 추출
- 캐싱 필수 (외부 API 제한)

### portfolio_analyzer/ (현태)
- 사용자 포트폴리오 입력/관리 (JSON 스키마)
- 종목명 → 티커 자동 매칭
- 수익률/평가금액/비중 계산
- 분석 리포트 (LLM)
- 백테스트 (QQQ/KOSPI 벤치마크)
- plotly 차트 반환

### coach_chat/ (수빈)
- Streamlit 메인 앱 (`coach_chat/main.py`)
- Q&A 챗 UI
- 컨텍스트 빌더 (은서/현태 출력 → LLM context)
- 대화 히스토리 관리

## 데이터 흐름

```
사용자 입력 (포트폴리오)
        ↓
[은서] Market Intelligence
  - stock_data (dict[ticker, StockData])
  - raw_news (list[NewsItem])
  - trending_keywords (list[TrendingKeyword])
  - daily_market_summary (str)
        ↓
[현태] Portfolio Analyzer
  - get_portfolio_data() → dict
  - get_analysis_report() → dict (AnalysisReport 변환)
  - get_backtest_result() → dict (BacktestResult 변환)
  - get_stock_chart() → plotly.Figure
        ↓
[수빈] Coach Chat
  - ChatContext 조립
  - LLM 호출
  - Streamlit UI 렌더링
```

세부 명세는 [INTERFACES.md](INTERFACES.md).

## 디렉토리

```
fincoach/
├── shared/                  데이터 계약, mock, config
├── market_intelligence/     은서 모듈
├── portfolio_analyzer/      현태 모듈
├── coach_chat/              수빈 모듈 + main.py
├── tests/
│   ├── test_contracts.py    Pydantic 계약 검증
│   └── integration/         E2E 시나리오
├── docs/
│   ├── ARCHITECTURE.md      이 문서
│   ├── INTERFACES.md        모듈 인터페이스 명세
│   ├── GIT_WORKFLOW.md      Git 워크플로우
│   ├── PR_REVIEW_PLAYBOOK.md CTO 리뷰 가이드
│   ├── decisions/           ADR
│   ├── meetings/            회의록
│   ├── daily-logs/          팀원별 일일 로그
│   └── onboarding/          팀원별 첫날 가이드
├── .claude/
│   ├── agents/cto-bot.md    CTO 대리 에이전트
│   ├── skills/              자동화 스킬
│   └── settings.json        Bash hook (위험 명령 차단)
└── .github/
    ├── CODEOWNERS           자동 리뷰 라우팅
    ├── workflows/ci.yml     ruff + pytest
    └── pull_request_template.md
```

## 외부 의존성

| 라이브러리 | 용도 | 모듈 |
|----------|------|------|
| streamlit | UI | coach_chat |
| pydantic | 데이터 계약 | shared |
| yfinance | 미국 주식 | market_intelligence, portfolio_analyzer |
| pykrx | 한국 주식 | market_intelligence, portfolio_analyzer |
| pandas/numpy | 데이터 처리 | 모두 |
| plotly | 차트 | portfolio_analyzer, coach_chat |
| openai | LLM | market_intelligence, portfolio_analyzer, coach_chat |
| pytrends | 검색 트렌드 | market_intelligence |
| feedparser | RSS | market_intelligence |

## 비기능 요구사항

- 단일 사용자 데모용. 멀티유저/세션 분리는 P2
- 외부 API 실패 시 mock fallback (배포 시연 안정성)
- LLM 비용: dev mode는 mock 응답, 통합 테스트 시점부터 실 API
- 면책 첨부 누락은 PR에서 차단
