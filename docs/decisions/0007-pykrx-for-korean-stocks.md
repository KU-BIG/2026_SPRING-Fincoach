# ADR 0007: 한국 주식은 pykrx

- 날짜: 2026-05-15
- 상태: 채택됨 (Accepted)
- 결정자: 병승 (5/14 8주차 회의에서 현태 제안)

## 컨텍스트

원래 yfinance만 쓰려 했으나 yfinance는 한국 종목명을 영문 표기로만 반환 (`Samsung Electronics`). 사용자가 한글 종목명 입력하고 한글로 출력 받기를 기대.

5/14 8주차 회의에서 현태가 `pykrx` 도입 제안. KOSPI/KOSDAQ 데이터, 한글 종목명, 기본 재무지표 (PER/PBR/EPS), 거래량 등 모두 제공. API 키 불필요.

## 결정

- **한국 주식 (`.KS`, `.KQ`)**: `pykrx` 우선 사용
- **미국 주식**: 기존대로 `yfinance`
- 티커 검색/매칭은 라이브러리별 분기
- 종목명은 한글 우선 표기 (UI 친화성)

## 결과

- 좋은 점:
  - 한글 종목명 자연 처리.
  - 추가 API 키 불필요.
  - 한국 시장 특수 데이터 (시총, 재무) 활용 가능.
- 트레이드오프: 라이브러리 두 개. 코드에 분기. → `shared/models.Market` enum으로 일관 분기.

## 대안

- yfinance 단독 + 한글 매핑 테이블 수동 관리: 종목 추가될 때마다 갱신 부담. 기각.
- 네이버 금융 크롤링: TOS 위반 가능성. 기각.
- 한국투자증권 KIS API: 키 필요 + 학습 곡선. 6주 안에 부담. 기각.

## 영향 범위

- [x] market_intelligence/ (주가 수집)
- [x] portfolio_analyzer/ (현재가 조회, 백테스트)
- [x] pyproject.toml (pykrx 의존성 추가)

## 후속 액션

- [x] `pyproject.toml`에 `pykrx>=1.0.45` 추가
- [ ] 은서 모듈에 `pykrx` 분기 로직
- [ ] 현태 모듈의 티커 매칭 함수에 `pykrx` 활용
