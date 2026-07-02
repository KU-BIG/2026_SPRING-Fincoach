# ADR 0013: CTO fixes in market_intelligence / shared / glossary (demo hardening)

- 날짜: 2026-07-02
- 상태: 채택됨 (Accepted)
- 결정자: 병승 (CTO). 은서(market_intelligence)·수빈(coach_chat/Learn)에게 인계 예정.

## 컨텍스트

데모(7/3) 직전 버그 헌트에서 은서/수빈 모듈에 확정 버그가 나왔다. 원칙상 각 모듈 owner가 고쳐야 하나(루트 CLAUDE.md 룰3), 데모 임박 + 명백한 correctness 이슈라 병승이 직접 수정하기로 결정([[0012-live-prices-and-full-stock-catalog]]의 portfolio 오버라이드를 market/glossary로 확장). 본 ADR로 기록하고 owner에게 인계한다.

## 결정

1. **뉴스 티커 오류** `market_intelligence/_fetch_news.py`: NAVER(035420)·카카오(035720)를 `.KQ`로 매핑했으나 둘 다 KOSPI 상장이라 `.KS`가 맞다. 앱 나머지(`web/src/lib/charts.ts`)는 `.KS`를 쓰므로, 뉴스의 `related_tickers`가 실제 보유 종목(`.KS`)에 매칭되지 않던 버그. `.KS`로 수정.
2. **outage 시 종목 누락** `shared/mocks.py` `mock_stock_data()`: 기존 2종목(005930.KS, AAPL)만 있어, 실시세(pykrx+yfinance) 전면 실패 시 `collect_market`이 `api.market.DEFAULT_TICKERS`의 000660.KS·NVDA를 조용히 누락했다. 두 종목을 mock에 추가해 전면 outage에도 요청 집합이 유지되게 함. (계약/모델 변경 아님 — 항목 추가만.)
3. **용어집 문구 drift** `web/src/pages/Learn.tsx`: PER 카드의 첫 페인트 정적 HTML이 `terms.per`(TOC 클릭 시 렌더 소스)보다 축약돼 있어, TOC 왕복 시 문구가 바뀌었다. 정적 카드를 `terms.per`와 동일 문구로 동기화.

## 결과

- 뉴스-보유 종목 상관관계가 NAVER/카카오까지 정상 연결.
- 전면 데이터 outage에도 시장 패널이 4종목 전부 표시(mock).
- 용어집 PER 카드가 진입/재방문에 일관.
- 트레이드오프: 은서/수빈 모듈을 CTO가 수정 — 본 ADR로 기록, 이후 소유권은 owner.

### Deferred (낮은 우선순위)

- `market_intelligence/engine.py`의 `market_date`가 전면 outage 시 `date.today()`를 보고(휴장일도) 하는 이슈는, staleness 표현 방식(마지막 실거래일 추적 vs 플래그)에 대한 은서의 설계 결정이 필요해 보류. mock 날짜를 바꾸면 다른 사용처/테스트에 파급되어 리스크 대비 이득이 낮음.

## 대안

- Issue로 은서/수빈 인계(거버넌스 정석)를 검토했으나, 데모 임박 + 명백한 소규모 correctness 수정이라 CTO 직접 수정 선택(병승 승인). deferred 항목만 owner 결정으로 남김.

## 영향 범위

- [x] shared/ (mocks.py — 항목 추가, 계약 불변; tests 통과 확인)
- [x] market_intelligence/ (_fetch_news.py — 은서 인계)
- [ ] portfolio_analyzer/
- [x] coach_chat/ 관련 UI (web/src/pages/Learn.tsx — 수빈 인계)
- [x] docs/ (본 ADR)
- [ ] .github/.claude/
