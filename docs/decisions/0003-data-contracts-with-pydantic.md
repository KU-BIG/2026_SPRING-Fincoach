# ADR 0003: 데이터 계약은 Pydantic

- 날짜: 2026-05-15
- 상태: 채택됨 (Accepted)
- 결정자: 병승

## 컨텍스트

모듈 간 dict로 데이터 주고받으면:
- 키 오타 발견 못 함 (런타임에 KeyError)
- 타입 추적 어려움 (변경 시 영향 모름)
- LLM이 잘못된 키 만들 가능성 높음

5/14 8주차 회의에서 현태는 본인 출력을 dict로 반환하기로 함. 이건 LLM context로 바로 `json.dumps()` 하기 위함이라 합리적.

## 결정

**모듈 간 입력**은 Pydantic 모델로 (`shared/models.py`). **수빈에게 가는 최종 출력만 dict** (현태 결정 존중).

내부 함수가 받는 입력 데이터는 Pydantic으로 검증, 마지막 단계에서 `model.model_dump()`로 dict 변환.

## 결과

- 좋은 점:
  - 모듈 경계에서 데이터 검증.
  - IDE/LLM이 타입 추론.
  - 인터페이스 변경 시 영향 추적 가능.
- 트레이드오프: Pydantic 학습 곡선 (특히 v2). → 예시 충분히 mock에 박아둠.

## 대안

- 전부 dict + TypedDict: 검증 안 됨. 기각.
- dataclass: 검증 약함, JSON 직렬화 불편. 기각.
- attrs: pydantic만큼 가지 않음. 기각.

## 영향 범위

- [x] shared/models.py (소스 오브 트루스)
- [x] 모든 모듈 (입출력 형식)

## 후속 액션

- [x] `shared/models.py` 생성
- [x] `shared/mocks.py` 생성 (개발 편의)
- [ ] `tests/test_contracts.py` 작성 (계약 자동 검증)
