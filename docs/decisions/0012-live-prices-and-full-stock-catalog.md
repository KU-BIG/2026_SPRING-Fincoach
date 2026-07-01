# ADR 0012: Live quotes for user holdings + full stock catalog

- 날짜: 2026-07-02
- 상태: 채택됨 (Accepted)
- 결정자: 병승 (CTO). 현태(portfolio_analyzer owner)에게 인계 예정.

## 컨텍스트

배포된 포트폴리오에서 수익률이 틀리게 나온다는 사용자 리포트:

- `portfolio_analyzer/analyzer.py`의 `get_portfolio_data`가 실제 유저 holdings를 받아도 시세는 항상 `mock_stock_data()`(삼성전자·Apple 2종목 고정)를 썼다. → mock에 없는 종목(예: 한화엔진)은 `calculator`가 매수평단으로 폴백해 **수익률 0%**, 삼성전자도 stale mock 값이라 실제와 다른 손익.
- 프론트 자동완성 카탈로그가 ~30종목 하드코딩이라 대부분의 종목을 찾을 수 없었다.
- MVP 3단계 "현재가/변동률 조회(pykrx/yfinance)"가 미구현 상태였다.

`portfolio_analyzer/`는 현태 모듈이지만, 데모(7/3) 임박 + 제품 정확성 이슈라 병승이 직접 수정하기로 결정(모듈 경계 일시 오버라이드). 본 ADR로 그 개입을 기록하고 현태에게 인계한다.

## 결정

1. **실시세 조회**: `portfolio_analyzer/price_fetcher.py` 신설. yfinance로 유저 holdings의 종가/전일대비를 병렬 조회하고 프로세스 내 10분 TTL 캐시. 한국(.KS/.KQ)·미국 티커 모두 처리, 6자리 숫자 코드는 `.KS` 정규화(실패 시 `.KQ` 재시도). 조회 실패 종목은 결과에서 빠져 `calculator`가 평단 폴백(수익률 0% = 안전 degrade).
2. **환경 게이트**: 실서비스에서만 켠다. `FINCOACH_LIVE_PRICES` 미설정이면 mock 유지 → 테스트/CI/로컬이 네트워크를 타지 않는다. `render.yaml`에 `FINCOACH_LIVE_PRICES=1` 추가.
3. **전체 종목 카탈로그**: `scripts/gen_stocks.py`가 FinanceDataReader로 KOSPI+KOSDAQ 전체 + 주요 미국 종목을 `web/public/stocks.json`(~2,800종목)으로 생성. 프론트 자동완성이 이 파일을 로드해 부분일치 검색·클릭 입력.

## 결과

- mock에 없던 종목도 실시세로 정확한 손익/비중 계산. 삼성전자도 실시간 종가 반영.
- 사용자가 거의 모든 상장 종목을 검색·선택 가능.
- 트레이드오프:
  - yfinance는 느리고 rate-limit이 있다 → TTL 캐시 + 병렬 조회로 완화. 조회 실패는 평단 폴백으로 degrade.
  - 환율은 아직 고정값(`DEFAULT_USD_KRW=1400`) — 별도 과제.
  - `stocks.json`은 정적 스냅샷 — 상장/폐지 반영하려면 `scripts/gen_stocks.py` 재실행.
  - 모듈 경계 일시 오버라이드(현태 모듈을 병승이 수정) — 본 ADR로 기록, 이후 소유권은 현태.

## 대안

- **pykrx 런타임 조회**: 이 개발 환경에서 KRX 엔드포인트 접근이 막혀(모든 날짜 빈 결과) 카탈로그 생성 불가. yfinance는 정상. 그래서 실시세는 yfinance, 카탈로그 생성은 FinanceDataReader 사용.
- **백엔드 검색 엔드포인트**(`/api/stocks/search`): 키 입력마다 네트워크 왕복 + 서버 pykrx 의존. 정적 `stocks.json` 클라이언트 필터가 데모에 더 즉각적.
- **하드코딩 카탈로그 확장**: 불완전("싹 다"가 아님) — 정적 전체 목록으로 대체.

## 영향 범위

- [ ] shared/
- [ ] market_intelligence/
- [x] portfolio_analyzer/ (price_fetcher.py 신설, analyzer.py 수정 — CTO 개입, 현태 인계)
- [ ] coach_chat/
- [x] web/ (public/stocks.json + 자동완성)
- [x] docs/ (본 ADR)
- [x] .github/.claude/ (render.yaml FINCOACH_LIVE_PRICES)
