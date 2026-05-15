# 현태 온보딩

환영합니다. 첫날 30분 가이드.

## 0. 사전 준비

- GitHub 계정으로 `KUBIG_conf3` 리포 collaborator 초대 수락
- Python 3.11+ 설치
- Claude Code 설치 (`pip install claude-code` 또는 `npm i -g @anthropic-ai/claude-code`)

## 1. 클론 & 셋업

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

## 2. Claude 켜기

```bash
claude
```

`CLAUDE.md`가 자동 로드되어 팀 룰 학습.

## 3. 본인 모듈 확인

```bash
cat portfolio_analyzer/CLAUDE.md
```

5/14에 본인이 정리한 인터페이스 4개 함수가 핵심:
- `get_portfolio_data() -> dict`
- `get_analysis_report() -> dict`
- `get_backtest_result() -> dict`
- `get_stock_chart() -> plotly.Figure`

## 4. mock 데이터 체험

```python
python -c "
from shared.mocks import mock_market_output, mock_portfolio, mock_analysis_report
print(mock_portfolio().model_dump_json(indent=2))
print(mock_analysis_report().model_dump_json(indent=2))
"
```

## 5. 첫 작업 시작

```bash
claude /start-day
```

## 6. 본인의 첫 PR (MVP 1단계 step 1-2)

5/14 노션 자료 기반:
1. JSON 스키마 확정 → `shared/models.py`의 `Portfolio`/`Account`/`Holding` 확인 (이미 만들어둠)
2. 종목명 → 티커 자동 매칭 함수 (`portfolio_analyzer/ticker_matcher.py`)

```python
# portfolio_analyzer/ticker_matcher.py
def name_to_ticker(name: str, market: str = "auto") -> str | None:
    """삼성전자 -> 005930.KS, Apple -> AAPL"""
    # 한국: pykrx로 종목명 검색
    # 미국: yfinance로 검색 또는 하드코딩 매핑
    ...
```

## 도구 (5/14 본인 정리)

- `stock_skills` 스킬 활용
- `korea-stock-analyzer-mcp` MCP
- `yfinance`, `pykrx` 라이브러리
- `context7` MCP로 라이브러리 최신 문서 조회

## 룰 체크

- [ ] `main` 직접 commit 금지
- [ ] `shared/` 수정 금지
- [ ] 매수/매도 추천 표현 금지 (본인 도메인이라 특히 주의)
- [ ] LLM 리포트에 `shared.disclaimers.attach(report, "report")` 호출

## 막히면

```bash
claude /ask-cto "{질문}"
```

## 본인의 일정

노션 8주차 회의록 + 본인 페이지 참고.
