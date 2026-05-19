# CLAUDE.md - FinCoach 루트 컨텍스트

이 파일은 이 리포에서 Claude 세션이 시작될 때 자동 로드됩니다. 모든 팀원의 Claude는 이 문서를 최상위 규칙으로 따릅니다.

## 프로젝트 개요

FinCoach는 사용자의 포트폴리오와 시장 정보를 함께 이해하는 금융 AI 코치입니다. 목표는 학습/시연용 MVP이며, 투자 자문이 아니라 정보 제공과 금융 개념 설명에 집중합니다.

현재 구조는 Python 코어 모듈과 React/Vite 웹 스캐폴드의 조합입니다.

- Python 코어: `shared/`, `market_intelligence/`, `portfolio_analyzer/`, `coach_chat/`
- 웹 UI: `web/` React + Vite + TypeScript. 백엔드 API 연결 전에는 mock fallback을 표시합니다.
- 자동화/협업: `.claude/`, `.github/`, `docs/`

## 전체 시스템 구조

```text
사용자 질문/포트폴리오 입력
        ↓
[은서] market_intelligence
  - 주가/뉴스/트렌드 수집
  - MarketOutput 생성
        ↓
[현태] portfolio_analyzer
  - 사용자 포트폴리오 계산
  - 분석 리포트/백테스트/차트 생성
        ↓
[수빈] coach_chat
  - MarketOutput + 포트폴리오 결과를 ChatContext로 조립
  - LLM 답변 생성, 면책 문구 첨부
        ↓
web/ 또는 Streamlit UI
  - 대시보드, 포트폴리오, 채팅, 학습 화면 렌더링
```

### 모듈 간 데이터 계약

- 소스 오브 트루스: `shared/models.py`
- 사람이 읽는 요약: `docs/INTERFACES.md`
- mock 데이터: `shared/mocks.py`
- 인터페이스 변경: `docs/decisions/`에 ADR 작성 후 병승 리뷰 필요

임의 dict로 모듈 경계를 넘기지 않습니다. 단, 현태 모듈의 수빈 전달 함수 4개는 5/14 회의 결정대로 dict 반환을 유지합니다.

## 팀 구조와 소유권

- 병승: `shared/`, `docs/`, `.github/`, `.claude/`, 루트 설정, 최종 인터페이스 조율
- 은서: `market_intelligence/` - Market Intelligence 모듈
- 현태: `portfolio_analyzer/` - Portfolio Analyzer 모듈
- 수빈: `coach_chat/` - Coach Chat 모듈과 사용자 대화 흐름
- `web/`: 병승이 세팅한 공통 UI 스캐폴드. UI 변경은 관련 모듈 owner가 담당하되 PR에서 영향 범위를 명시합니다.

각 모듈 폴더의 `CLAUDE.md`에 owner와 세부 책임이 있습니다.

## 절대 룰

1. `main` 브랜치 직접 push 금지. 항상 `feature/{이름}-{기능}` 브랜치에서 작업하고 PR로 올립니다.
2. 위험 git 명령 금지: `git push --force`, `git push -f`, `git reset --hard`.
3. 다른 사람 모듈 폴더 수정 금지. 필요한 경우 먼저 Issue 또는 ADR로 합의합니다.
4. `shared/` 수정은 병승 리뷰 필수. 인터페이스 변경이면 ADR이 먼저입니다.
5. 사용자가 보는 모든 금융 분석/답변에는 면책 문구를 붙입니다.
6. 특정 종목의 직접적인 매수/매도 추천 표현 금지. 정보 제공, 리스크 설명, 시나리오 비교만 허용합니다.
7. 시크릿 노출 금지. `.env`, API key, token, 개인 계좌 정보는 커밋하지 않습니다.
8. 머지 전 CI 통과와 리뷰 1개가 필요합니다.

## 작업 시작 전 체크

```bash
git status -sb
git log --oneline -5
claude /start-day
```

새 세션에서는 반드시 본인 모듈 문서를 읽습니다.

- 은서: `market_intelligence/CLAUDE.md`, `docs/team-instructions/eunseo.md`
- 현태: `portfolio_analyzer/CLAUDE.md`, `docs/team-instructions/hyuntae.md`
- 수빈: `coach_chat/CLAUDE.md`, `docs/team-instructions/subin.md`

## 작업 종료 체크

```bash
pytest
claude /wrap-day
```

웹을 수정했다면 추가로 실행합니다.

```bash
cd web
npm test
npm run build
```

## 브랜치와 커밋 규칙

브랜치:

```text
feature/eunseo-<기능명>
feature/hyuntae-<기능명>
feature/subin-<기능명>
feature/byungseung-<기능명>
```

커밋 메시지:

```text
[모듈] 한 줄 요약

- 무엇이 바뀌었는지
- 왜 바꿨는지
```

모듈 prefix:

- `[market]`: `market_intelligence/`
- `[portfolio]`: `portfolio_analyzer/`
- `[chat]`: `coach_chat/`
- `[web]`: `web/`
- `[shared]`: `shared/`
- `[docs]`: `docs/`
- `[ci]`: `.github/`, `.claude/`, 루트 설정

## 현재 통합 인터페이스

### 은서 → 현태/수빈

```python
from market_intelligence.engine import collect_market
from shared.models import MarketOutput

market: MarketOutput = collect_market(tickers=["005930.KS", "AAPL"])
```

반환 객체는 반드시 `MarketOutput`입니다.

### 현태 → 수빈/UI

```python
def get_portfolio_data() -> dict: ...
def get_analysis_report(force_refresh: bool = False) -> dict: ...
def get_backtest_result(period: str = "1y") -> dict: ...
def get_stock_chart(ticker: str, period: str = "1mo"): ...
```

느린 함수는 사용자가 요청했을 때만 호출하고, 빠른 요약은 dashboard에서 상시 호출 가능하게 유지합니다.

### 수빈 → 사용자

```python
from shared.models import ChatContext

ctx = build_context(question)
answer = answer(question, ctx)
```

LLM 답변은 정보 제공 톤으로 작성하고 `shared.disclaimers.QA_DISCLAIMER`를 붙입니다.

### web/ API 기대 형태

현재 웹 스캐폴드는 아래 endpoint를 기대하고, 실패하면 mock 데이터를 표시합니다.

- `GET /api/market/summary`
- `GET /api/portfolio/summary`

백엔드 연결 전에는 mock fallback이 정상 동작해야 합니다.

## 테스트 기준

- Python 공통: `pytest`
- 타입/정적 검사: `ruff check .`, 필요 시 `mypy`
- 웹: `cd web && npm test && npm run build`
- 외부 API를 쓰는 코드는 실패 시 mock fallback 또는 명확한 에러 처리를 둡니다.
- PR에는 최소 happy path 테스트를 포함합니다.

## 블로커 처리

혼자 판단하지 말고 질문을 기록합니다.

```bash
claude /ask "질문 내용"
```

다음 경우는 반드시 병승에게 묻습니다.

- `shared/models.py` 변경 필요
- 다른 팀원 모듈을 건드려야 함
- UI/백엔드 큰 구조 변경
- 금융 표현이 추천처럼 보일 수 있음
- 외부 API 키나 유료 사용량 문제가 있음

## 참고 문서

- `docs/ARCHITECTURE.md`: 전체 아키텍처 설명
- `docs/INTERFACES.md`: 모듈 인터페이스 명세
- `docs/GIT_WORKFLOW.md`: 브랜치/PR 흐름
- `docs/PR_REVIEW_PLAYBOOK.md`: 리뷰 기준
- `docs/WEEK_1_TASKS.md`: 이번 주 작업 범위
- `docs/team-instructions/`: 팀원별 배포용 지시문
- `docs/decisions/`: ADR
