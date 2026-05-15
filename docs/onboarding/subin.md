# 수빈 온보딩

환영합니다. 첫날 30분 가이드.

## 0. 사전 준비

- GitHub 계정으로 `KUBIG_conf3` 리포 collaborator 초대 수락
- Python 3.11+ 설치
- Claude Code 설치

## 1. 클론 & 셋업

```bash
git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
cd fincoach
pip install uv
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
git config user.name subin
git config user.email {본인 이메일}
```

## 2. Streamlit 띄워보기

```bash
streamlit run coach_chat/main.py
```

기본 챗 UI 골격이 떠야 합니다 (CTO가 0주차에 세팅).

## 3. Claude 켜기

```bash
claude
```

`CLAUDE.md` 자동 로드.

## 4. 본인 모듈 확인

```bash
cat coach_chat/CLAUDE.md
```

5주차 회의 결정: **Q&A 기능만 우선.** 대시보드는 P1.

## 5. mock 데이터 체험

```python
python -c "
from shared.mocks import mock_market_output, mock_analysis_report
m = mock_market_output()
r = mock_analysis_report()
print('Market summary:', m.daily_market_summary)
print('Report:', r.summary)
"
```

본인이 만들어야 할 챗 컨텍스트 입력 데이터.

## 6. 첫 작업 시작

```bash
claude /start-day
```

## 7. 본인의 첫 PR

- `coach_chat/context_builder.py` 만들기
- `mock_market_output()` + `mock_analysis_report()` 받아서 LLM 시스템 프롬프트 조립

```python
# coach_chat/context_builder.py
from shared.models import ChatContext, MarketOutput, AnalysisReport

def build_system_prompt(ctx: ChatContext) -> str:
    parts = ["당신은 FinCoach 학습 도우미입니다."]
    if ctx.market:
        parts.append(f"[시장 브리핑] {ctx.market.daily_market_summary}")
    if ctx.analysis_report:
        parts.append(f"[내 포트폴리오 요약] {ctx.analysis_report.summary}")
    parts.append("매수/매도를 직접 추천하지 않습니다.")
    return "\n\n".join(parts)
```

## 룰 체크

- [ ] `main` 직접 commit 금지
- [ ] `shared/`, `market_intelligence/`, `portfolio_analyzer/` 수정 금지
- [ ] LLM 응답에 `shared.disclaimers.QA_DISCLAIMER` 첨부
- [ ] dict 직접 다루지 말고 `shared.models` Pydantic 객체 사용

## 막히면

```bash
claude /ask-cto "{질문}"
```

## 본인의 일정

노션 MVP 기능 명세 페이지 + 8주차 회의록 참고. Q&A 기능 위주로 진행.
