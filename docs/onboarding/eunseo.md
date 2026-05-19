# 은서 온보딩

소요 시간: 첫날 30분. 환경 셋업 위주. 실제 작업 지시문은 `docs/team-instructions/eunseo.md`.

## 0. 사전 준비

- GitHub 계정으로 `KUBIG_conf3` 리포 collaborator 초대 수락
- Python 3.11+ 설치
- Claude Code 설치 (VS Code 확장 또는 `npm i -g @anthropic-ai/claude-code`)

## 1. 클론 및 셋업 (5분)

```bash
git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
cd fincoach
pip install uv
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
```

git 설정:
```bash
git config user.name eunseo
git config user.email {본인 이메일}
```

## 2. Claude 실행 (1분)

```bash
claude
```

`CLAUDE.md` 자동 로드됨.

## 3. 본인 모듈 확인 (5분)

```bash
cat market_intelligence/CLAUDE.md
```

본인 책임/입력/출력 명세 확인.

## 4. mock 데이터 확인 (5분)

```bash
python -c "from shared.mocks import mock_market_output; print(mock_market_output().model_dump_json(indent=2))"
```

본인이 만들 출력의 구조 확인.

## 5. 작업 지시문 주입 (5분)

`docs/team-instructions/eunseo.md` 안의 코드 블록을 Claude 첫 메시지로 그대로 붙여넣음. 본인 모듈 owner 룰과 첫 PR 목표가 모두 포함돼 있음.

## 6. 첫 PR

`market_intelligence/engine.py` 파일 생성. mock 반환 더미 함수 1개부터:

```python
from shared.models import MarketOutput
from shared.mocks import mock_market_output

def collect_market(tickers: list[str]) -> MarketOutput:
    return mock_market_output()
```

첫 PR 기준: 작은 단위, 인터페이스 학습용, mock 활용으로 타 모듈 영향 없음.

## 룰 체크

- `main` 직접 commit 금지
- `shared/` 수정 금지 (공통 영역)
- 타 모듈 폴더 수정 금지
- 매수/매도 추천 표현 금지

## 블로커/질문

GitHub Issue 작성. 또는 팀 톡방.
