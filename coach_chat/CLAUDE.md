# coach_chat/ - 수빈의 모듈

이 모듈은 **수빈**이 소유합니다. Streamlit 메인 앱도 여기에.

## 책임

대화형 인터페이스. 모든 모듈의 출력을 LLM context로 받아 사용자와 대화.

**입력:** 은서의 `MarketOutput` + 현태의 함수들
**출력:** Streamlit UI

세부 명세는 [docs/INTERFACES.md](../docs/INTERFACES.md)와 노션 [MVP 기능 명세](https://www.notion.so/32f5be6fc8fd802dbb58e0db43e1ad63) 참고.

## 권한

- 이 폴더 안 자유롭게 수정 OK
- Streamlit 메인 앱 (`coach_chat/main.py`)도 여기서 관리
- `shared/`, `market_intelligence/`, `portfolio_analyzer/` 수정 금지

## 룰

1. 5주차 회의 결정: **Q&A 기능만 우선**. 대시보드 등은 P1
2. LLM 응답에는 항상 `shared.disclaimers.QA_DISCLAIMER` 첨부
3. 다른 모듈 출력은 `shared.models` Pydantic 객체로 받기 (dict 직접 다루지 마)
4. 세션 캐시 사용 (현태가 같은 데이터 두 번 안 만들게)

## 개발 시작

```bash
git checkout -b feature/subin-<기능명>
streamlit run coach_chat/main.py
```

## 다른 모듈 안 기다리고 개발하기

```python
from shared.mocks import mock_market_output, mock_analysis_report
m = mock_market_output()
r = mock_analysis_report()
```

## Streamlit 메인 앱 골격은 0주차에 CTO가 세팅함

본인 작업: Q&A 챗 UI, 컨텍스트 빌더 (`coach_chat/context_builder.py`)

## 컨텍스트 잃지 마

```bash
cat docs/daily-logs/subin/$(ls docs/daily-logs/subin/ | tail -1)
```
