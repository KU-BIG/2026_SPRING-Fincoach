# 은서 온보딩

환영합니다. 첫날 30분 가이드.

## 0. 사전 준비

- GitHub 계정으로 `KUBIG_conf3` 리포 collaborator 초대 수락
- Python 3.11+ 설치
- VSCode 또는 터미널에서 Claude Code 설치 (`pip install claude-code` 또는 `npm i -g @anthropic-ai/claude-code`)

## 1. 클론 & 셋업 (5분)

```bash
git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
cd fincoach
pip install uv
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env  # API 키 채우기
```

git 설정 확인:
```bash
git config user.name eunseo   # 또는 한글 이름. wrap-day가 신원 자동 감지
git config user.email {본인 이메일}
```

## 2. Claude 켜기 (1분)

이 폴더에서 Claude Code를 켜면 `CLAUDE.md`가 자동 로드되어 룰을 학습합니다.

```bash
claude
```

## 3. 본인 모듈 확인 (5분)

`market_intelligence/CLAUDE.md` 읽어보기:

```bash
cat market_intelligence/CLAUDE.md
```

여기에 본인이 무엇을 만들어야 하는지, 다른 모듈과 어떻게 데이터를 주고받는지 적혀있습니다.

## 4. mock 데이터 체험 (5분)

```python
python -c "from shared.mocks import mock_market_output; print(mock_market_output().model_dump_json(indent=2))"
```

이게 본인이 만들어야 할 출력의 모양입니다.

## 5. 첫 작업 시작 (15분)

```bash
# 어제 로그 확인 + main 최신화 + 오늘 할 일
claude /start-day
```

LLM이 알아서 브랜치 만들고 작업 시작합니다.

작업 끝나면:

```bash
claude /wrap-day
```

→ 자동 commit, push, draft PR 생성, 일일 로그 저장.

## 6. 본인의 첫 PR

1단계 작업 예시:
- 본인 모듈에 `engine.py` 파일 만들기 (시그니처만)
- `mock_market_output()` 반환하는 `collect_market()` 더미 함수

```python
# market_intelligence/engine.py
from shared.models import MarketOutput
from shared.mocks import mock_market_output

def collect_market(tickers: list[str]) -> MarketOutput:
    return mock_market_output()
```

이게 첫 PR로 적합. 작고, 인터페이스 학습, mock으로 다른 팀원 영향 없음.

## 룰 체크

- [ ] `main` 직접 commit 금지
- [ ] `shared/` 수정 금지 (CTO에게 핑)
- [ ] 다른 사람 모듈 (`portfolio_analyzer/`, `coach_chat/`) 수정 금지
- [ ] 매수/매도 추천 표현 금지

## 막히면

```bash
claude /ask-cto "{질문}"      # GitHub Issue 자동 생성
```

또는 cto-bot 호출:
```bash
claude /cto-review {PR번호}    # PR 1차 리뷰
```

## 본인의 일정

5/14 8주차 회의록 기준으로 진행. 진행 상황은 본인의 노션 페이지에 업데이트.

화이팅.
