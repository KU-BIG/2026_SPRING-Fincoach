# 현태 온보딩

소요 시간: 첫날 30분.

## 0. 사전 준비

- GitHub 계정으로 `KUBIG_conf3` 리포 collaborator 초대 수락
- Python 3.11+ 설치
- Claude Code 설치

## 1. 클론 및 셋업

```bash
git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
cd fincoach
pip install uv
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
git config user.name hyuntae
git config user.email {본인 이메일}
```

## 2. Claude 실행

```bash
claude
```

`CLAUDE.md` 자동 로드됨.

## 3. 본인 모듈 확인

```bash
cat portfolio_analyzer/CLAUDE.md
```

5/14 노션 기준 인터페이스 4개 함수:
- `get_portfolio_data() -> dict`
- `get_analysis_report() -> dict`
- `get_backtest_result() -> dict`
- `get_stock_chart() -> plotly.Figure`

## 4. mock 데이터 확인

```bash
python -c "
from shared.mocks import mock_market_output, mock_portfolio, mock_analysis_report
print(mock_portfolio().model_dump_json(indent=2))
print(mock_analysis_report().model_dump_json(indent=2))
"
```

## 5. 작업 시작

```bash
claude /start-day
```

## 6. 첫 PR (MVP 1단계 step 1-2)

5/14 노션 자료 기반:
1. JSON 스키마 확인 (`shared/models.py`의 `Portfolio`/`Account`/`Holding` 활용)
2. 종목명 → 티커 매칭 함수 (`portfolio_analyzer/ticker_matcher.py`)

```python
def name_to_ticker(name: str, market: str = "auto") -> str | None:
    # 한국: pykrx로 종목명 검색
    # 미국: yfinance 또는 하드코딩 매핑
    ...
```

## 도구 (5/14 본인 정리)

- `stock_skills` 스킬
- `korea-stock-analyzer-mcp` MCP
- `yfinance`, `pykrx` 라이브러리
- `context7` MCP (라이브러리 최신 문서 조회)

## 룰 체크

- `main` 직접 commit 금지
- `shared/` 수정 금지
- 매수/매도 추천 표현 금지 (도메인 특성상 특히 주의)
- LLM 리포트에 `shared.disclaimers.attach(report, "report")` 호출

## 블로커 발생 시

```bash
claude /ask-cto "{질문}"
```

## 일정

노션 8주차 회의록 + 본인 페이지 참조.
