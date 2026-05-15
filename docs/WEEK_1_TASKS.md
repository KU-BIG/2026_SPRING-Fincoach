# 1주차 작업 (5/16 ~ 5/22)

## 모두 (5분)

- [ ] [docs/TEAM_KICKOFF.md](TEAM_KICKOFF.md) 읽기
- [ ] [docs/SETUP.md](SETUP.md) 따라 환경 셋업
- [ ] 본인 [docs/onboarding/{이름}.md](onboarding/) 읽기
- [ ] 본인 모듈 폴더의 `CLAUDE.md` 읽기

## 은서 (Market Intelligence)

### 첫 PR 권장 목표
- `market_intelligence/engine.py` 파일 생성
- 함수 시그니처 1개: `collect_market(tickers: list[str]) -> MarketOutput`
- 본문은 일단 `mock_market_output()` 반환만 해도 OK
- 그 다음 PR부터 실제 yfinance/pykrx 호출 채워나감

### 첫 PR이 아닌, 1주차 끝까지 도전
- 주가 데이터 1개 종목 (예: 삼성전자) 실제 수집 → `StockData` 반환
- 노션 [현태스킬](https://www.notion.so/3605be6fc8fd80038ef7cbedc3347828)의 라이브러리 참고 (pykrx)

## 현태 (Portfolio Analyzer)

### 첫 PR 권장 목표
- `portfolio_analyzer/__init__.py` 또는 새 파일에 4개 함수 시그니처 작성:
  - `get_portfolio_data() -> dict`
  - `get_analysis_report(force_refresh: bool = False) -> dict`
  - `get_backtest_result(period: str = "1y") -> dict`
  - `get_stock_chart(ticker: str, period: str = "1mo")` (plotly.Figure 등 본인 선택)
- 본문은 mock 반환만 (`shared.mocks` 활용)

### 1주차 끝까지 도전
- 노션 [현태스킬](https://www.notion.so/3605be6fc8fd80038ef7cbedc3347828) MVP 1단계:
  - JSON 스키마 확정 (shared/models.py 의 Portfolio 사용 가능)
  - 종목명 → 티커 매칭 1개 (`name_to_ticker("삼성전자")` → `"005930.KS"`)

## 수빈 (Coach Chat)

### 첫 PR 권장 목표
- **스택 결정**: Streamlit / React+Vite / Next.js / CLI 중 하나
  - 결정 후 `docs/decisions/0008-coach-chat-frontend.md` ADR 작성 (TEMPLATE.md 참고)
- 결정한 스택의 기본 골격 1개 페이지 (라우팅 없이)

### 1주차 끝까지 도전
- `coach_chat/context_builder.py` 작성:
  - `build_context(question: str) -> ChatContext`
  - mock 사용해서 동작
- LLM 호출 없이 컨텍스트만 조립

## CTO (병승)

### 본인 1주차 작업
- 팀 PR 일일 리뷰 (24시간 룰)
- 막힌 팀원 페어 코딩 (`/ask-cto` Issue 답변)
- 통합 포인트 미리 점검 (목요일 통합 데이 준비)
- Hermes cto-bot 데일리 디지스트 모니터링

## 작업 흐름 (모두 동일)

```bash
# 매일 시작
claude /start-day

# 작업 (자유)
# 본인 모듈 안에서 LLM과 함께

# 매일 끝
claude /wrap-day
```

이게 자동으로:
- feature 브랜치 생성/유지
- 커밋 + 푸시
- draft PR 생성
- 일일 로그 저장 (다음 채팅 컨텍스트 복구용)

## 막히면

```
claude /ask-cto "{질문}"
```

## 1주차 끝 (5/22 일요일)

각자 본인이 무엇이 잘 됐고 무엇이 막혔는지 한 줄씩 `docs/retros/2026-05-22.md` 에 추가. CTO가 종합해서 2주차 계획 조정.
