# 수빈 온보딩

소요 시간: 첫날 30분. 환경 셋업 위주. 실제 작업 지시문은 `docs/team-instructions/subin.md`.

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
git config user.name subin
git config user.email {본인 이메일}
```

## 2. Claude 실행

```bash
claude
```

`CLAUDE.md` 자동 로드됨.

## 3. 본인 모듈 확인

```bash
cat coach_chat/CLAUDE.md
```

Q&A 기능 우선. 대시보드는 P1.

## 4. 프론트엔드

`web/`에 React + Vite + TypeScript 스캐폴드가 이미 존재. UI 작업은 그 위에서 진행 (Chat.tsx, Learn.tsx 등 본인 담당 화면).

다른 방식 쓰고 싶으면 ADR 작성 후 진행 (`docs/decisions/TEMPLATE.md`).

## 5. mock 데이터 확인

```bash
python -c "
from shared.mocks import mock_market_output, mock_analysis_report
m = mock_market_output()
r = mock_analysis_report()
print('Market summary:', m.daily_market_summary)
print('Report:', r.summary)
"
```

본인이 LLM context로 받을 데이터 구조.

## 6. 작업 지시문 주입

`docs/team-instructions/subin.md` 안의 코드 블록을 Claude 첫 메시지로 그대로 붙여넣음. 본인 모듈 owner 룰과 첫 PR 목표가 모두 포함돼 있음.

## 7. 첫 PR

`coach_chat/context_builder.py` 작성:

```python
from shared.models import ChatContext, MarketOutput, AnalysisReport

def build_system_prompt(ctx: ChatContext) -> str:
    parts = ["FinCoach 학습 도우미."]
    if ctx.market:
        parts.append(f"[시장 브리핑] {ctx.market.daily_market_summary}")
    if ctx.analysis_report:
        parts.append(f"[포트폴리오 요약] {ctx.analysis_report.summary}")
    parts.append("매수/매도 직접 추천 금지.")
    return "\n\n".join(parts)
```

## 룰 체크

- `main` 직접 commit 금지
- `shared/`, `market_intelligence/`, `portfolio_analyzer/` 수정 금지
- LLM 응답에 `shared.disclaimers.QA_DISCLAIMER` 첨부
- 모듈 간 데이터는 `shared.models` Pydantic 객체 사용 (dict 직접 다루지 말 것)

## 블로커/질문

GitHub Issue 작성. 또는 팀 톡방.
