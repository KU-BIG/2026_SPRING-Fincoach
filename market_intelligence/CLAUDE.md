# market_intelligence/ - 은서의 모듈

이 모듈은 **은서**가 소유합니다.

## 책임

시장 데이터 수집과 가공. 다른 모듈에 깨끗한 데이터를 공급합니다.

**입력:** 종목 티커 리스트 (예: `["005930.KS", "AAPL"]`)
**출력:** `shared.models.MarketOutput` (Pydantic 모델)

세부 명세는 [docs/INTERFACES.md](../docs/INTERFACES.md)와 노션 [e2e 회의 3주차](https://www.notion.so/3595be6fc8fd80c8bc10f7ee91b5814b) 참고.

## 권한

- 이 폴더 안 자유롭게 수정 OK
- `shared/`, `portfolio_analyzer/`, `coach_chat/` 수정 금지
- `tests/` 본인 모듈용 테스트는 추가 OK

## 룰

1. 외부 API (yfinance/pytrends/RSS)는 반드시 캐시 레이어 거치기 (실패해도 fallback 동작)
2. 함수 반환은 dict 말고 `shared.models`의 Pydantic 객체
3. 비용 큰 호출 (LLM 요약 등)은 dev mode에서 mock 반환
4. 매수/매도 표현 금지

## 개발 시작

```bash
git checkout -b feature/eunseo-<기능명>
# 작업
claude /wrap-day
```

## 다른 모듈 안 기다리고 개발하기

수빈/현태 모듈이 본인 데이터 받아야 하는데, 본인 코드 다 안 됐어도 mock으로 즉시 흐름 검증 가능:

```python
from shared.mocks import mock_market_output
m = mock_market_output()
```

## 컨텍스트 잃지 마

새 채팅 시작할 때:

```bash
ls docs/daily-logs/eunseo/ | tail -3   # 최근 3일 로그
cat docs/daily-logs/eunseo/$(ls docs/daily-logs/eunseo/ | tail -1)
```

## 일정 (5/14 8주차 기준)

세부 진행은 본인의 노션 페이지/회의록 참고. CTO에게 막힌 거 있으면 즉시 핑.
