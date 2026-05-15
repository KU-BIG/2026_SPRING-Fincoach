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

## 룰 (CTO가 강제)

1. LLM 응답에는 항상 `shared.disclaimers.QA_DISCLAIMER` 첨부
2. 모듈 간 데이터는 `shared.models` Pydantic 객체로 받기 (dict 직접 다루지 마)
3. 매수/매도 추천 표현 금지

## 자유 (수빈이 결정)

- 프레임워크: Streamlit / React+Vite / Next.js / CLI 등 무엇이든 본인이 정해라
  - 노션 MVP 명세는 React+TS+FastAPI 였음. 5주차 회의 후 단순화 논의 있었음. 최종 선택은 본인이
- Q&A만 vs 대시보드까지 vs 풀버전 (스코프)
- 세션 캐싱 전략
- LLM 클라이언트 (openai / anthropic / litellm)

본인 모듈에서 큰 결정 (스택 변경 등)은 `docs/decisions/`에 ADR 추가하면 좋다.

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
