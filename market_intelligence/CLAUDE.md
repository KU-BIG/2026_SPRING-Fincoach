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

## 룰 (CTO가 강제)

1. 모듈 출력은 `shared.models.MarketOutput` Pydantic 객체
2. 매수/매도 추천 표현 금지

## 자유 (은서가 결정)

- 데이터 소스 (yfinance / pykrx / 네이버 / 조선 RSS 등)
- 캐싱 전략 (메모리 / SQLite / Redis / 파일)
- LLM 사용 여부 (요약 안 만들고 raw만 줘도 됨)
- 함수 분리, 클래스 구조
- 비용/속도 트레이드오프

큰 결정은 `docs/decisions/`에 ADR.

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
