# portfolio_analyzer/ - 현태의 모듈

이 모듈은 **현태**가 소유합니다.

## 책임

사용자 포트폴리오 입력/관리, 분석 리포트 생성, 백테스트.

**입력:** 사용자 포트폴리오 + 은서의 `MarketOutput`
**출력 (수빈에게 전달):**
- `get_portfolio_data() -> dict` - 빠름, 항상 호출 OK
- `get_analysis_report(force_refresh=False) -> dict` - 느림, 요청 시
- `get_backtest_result(period="1y") -> dict` - 느림, 요청 시
- `get_stock_chart(ticker, period) -> plotly.Figure`

세부 명세는 [docs/INTERFACES.md](../docs/INTERFACES.md)와 노션 [현태스킬](https://www.notion.so/3605be6fc8fd80038ef7cbedc3347828) 페이지 참고.

## 권한

- 이 폴더 안 자유롭게 수정 OK
- `shared/`, `market_intelligence/`, `coach_chat/` 수정 금지

## 공통 룰

1. 수빈에게 가는 4개 함수 시그니처는 노션 5/14 회의대로 (`get_portfolio_data` 등)
2. LLM 리포트에 `shared.disclaimers.attach()` 호출
3. 매수/매도 직접 추천 금지 ("정보 제공" 톤)

## 자유 (현태가 결정)

- 한국/미국 데이터 소스 (pykrx, yfinance, KIS API 등)
- 백테스트 알고리즘
- 차트 라이브러리 (plotly / altair / matplotlib)
- 캐싱 전략, 파일 분리

큰 결정은 `docs/decisions/`에 ADR.

## MVP 1단계 (확정된 우선순위 - 노션 5/14 회의)

1. JSON 스키마 확정
2. 종목명 → 티커 자동 매칭
3. 현재가/변동률 조회 (한국=pykrx, 미국=yfinance)
4. 수익률/평가금액/비중 계산
5. Streamlit 요약 표
6. `get_portfolio_data()` 출력 함수

## 개발 시작

```bash
git checkout -b feature/hyuntae-<기능명>
claude /wrap-day
```

## 다른 모듈 안 기다리고 개발하기

```python
from shared.mocks import mock_market_output, mock_portfolio
m = mock_market_output()
p = mock_portfolio()
```

## 컨텍스트 잃지 마

```bash
cat docs/daily-logs/hyuntae/$(ls docs/daily-logs/hyuntae/ | tail -1)
```
