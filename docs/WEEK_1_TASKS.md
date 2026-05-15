# 1주차 작업 (5/16 ~ 5/22)

## 모두 (5분)

- [ ] [docs/TEAM_KICKOFF.md](TEAM_KICKOFF.md) 읽기
- [ ] [docs/SETUP.md](SETUP.md) 따라 환경 셋업
- [ ] 본인 [docs/onboarding/{이름}.md](onboarding/) 읽기
- [ ] 본인 모듈 폴더의 `CLAUDE.md` 읽기

## 은서 (Market Intelligence)

### 첫 PR 범위
- `market_intelligence/engine.py` 파일 생성
- 함수 시그니처 1개: `collect_market(tickers: list[str]) -> MarketOutput`
- 본문은 `mock_market_output()` 반환만 (이후 PR에서 실제 yfinance/pykrx 채워나감)

### 1주차 추가 목표
- 주가 데이터 1개 종목 (예: 삼성전자) 실제 수집 → `StockData` 반환
- 노션 [현태스킬](https://www.notion.so/3605be6fc8fd80038ef7cbedc3347828)의 라이브러리 참고 (pykrx)

## 현태 (Portfolio Analyzer)

### 첫 PR 범위
- `portfolio_analyzer/__init__.py` 또는 새 파일에 4개 함수 시그니처 작성:
  - `get_portfolio_data() -> dict`
  - `get_analysis_report(force_refresh: bool = False) -> dict`
  - `get_backtest_result(period: str = "1y") -> dict`
  - `get_stock_chart(ticker: str, period: str = "1mo")` (반환 타입 본인 결정)
- 본문은 mock 반환 (`shared.mocks` 활용)

### 1주차 추가 목표
- 노션 [현태스킬](https://www.notion.so/3605be6fc8fd80038ef7cbedc3347828) MVP 1단계:
  - JSON 스키마 확정 (shared/models.py 의 Portfolio 사용 가능)
  - 종목명 → 티커 매칭 1개 (`name_to_ticker("삼성전자")` → `"005930.KS"`)

## 수빈 (Coach Chat)

### 첫 PR 범위
- 스택 결정: Streamlit / React+Vite / Next.js / CLI 중 선택
- 결정 후 `docs/decisions/0008-coach-chat-frontend.md` ADR 작성 (TEMPLATE.md 참조)
- 선택한 스택의 기본 골격 1페이지 (라우팅 없이)

### 1주차 추가 목표
- `coach_chat/context_builder.py` 작성:
  - `build_context(question: str) -> ChatContext`
  - mock 사용해서 동작
- LLM 호출 없이 컨텍스트만 조립

## 병승

- 팀 PR 일일 리뷰 (24시간 룰)
- 블로커 팀원 페어 작업 (`/ask` Issue 답변)
- 통합 포인트 사전 점검 (목요일 통합 데이 준비)
- Hermes fincoach-bot 데일리 디지스트 모니터링

## 작업 흐름 (공통)

```bash
claude /start-day    # 매일 시작
# 작업
claude /wrap-day     # 매일 종료
```

자동 처리:
- feature 브랜치 생성/유지
- 커밋 + 푸시
- draft PR 생성
- 일일 로그 저장 (다음 세션 컨텍스트 복구용)

## 블로커 발생 시

```
claude /ask "{질문}"
```

## 1주차 종료 (5/22 일)

각자 `docs/retros/2026-05-22.md`에 잘된 점/막힌 점 한 줄 추가. 병승 종합 후 2주차 계획 조정.
