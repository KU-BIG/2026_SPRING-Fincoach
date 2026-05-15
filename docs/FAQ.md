# FAQ

자주 막히는 것들. 여기 없는 거면 `claude /ask "{질문}"` 또는 GitHub Issue.

## 셋업

### Q. `uv pip install` 이 실패해요
- uv 설치 자체가 안 됐을 가능성: `curl -LsSf https://astral.sh/uv/install.sh | sh` 다시
- Python 3.11 아닐 가능성: `python3 --version` 확인
- 그래도 안 되면 일반 pip 시도: `pip install -e ".[dev]"`

### Q. `claude` 명령이 없어요
- npm 설치 후 `which claude` 확인
- PATH 문제일 수 있음: `~/.npmrc` 의 prefix 확인 또는 VS Code 확장 사용

### Q. WSL2가 Windows 파일 시스템(/mnt/d/...) 쓰니까 느려요
- 정상. 하지만 의미 있는 문제 수준이면 WSL2 홈(`~/`)으로 clone 권장

### Q. `pytest` 가 import 못 찾아요
- `uv pip install -e ".[dev]"` 다시 실행 (`-e` 가 editable install)
- 가상환경 활성화 확인: `which python` 이 `.venv/bin/python` 가리켜야 함

## Git

### Q. main에 push 하려고 했는데 막혀요
- 정상. main 보호됨. `git checkout -b feature/{본인이름}-{기능명}` 으로 브랜치 생성 후 작업
- PR로 머지

### Q. force push 하라고 LLM이 시켜요
- 절대 하지 마세요. hook으로 차단됨. force push 필요한 상황 자체가 잘못된 워크플로우
- 대안: 새 브랜치 만들어서 다시 작업

### Q. merge conflict 났어요
- 우선 `git rebase --abort` 로 안전하게 복귀
- 그 다음 `claude /sync-main` 으로 main 최신화 시도
- 그래도 conflict면 `claude /ask "conflict 났어, {파일명}"` 으로 도움 요청

### Q. 어제 작업한 게 사라졌어요 (새 채팅 켰더니)
- `claude /start-day` 실행하면 일일 로그에서 복구
- 그래도 없으면 `git log --oneline` 으로 커밋 확인
- 진짜 사라졌으면 reflog: `git reflog | head -20`

### Q. 다른 사람 모듈 폴더 수정해야 할 것 같아요
- 거의 항상 잘못된 신호. 본인 모듈에서 해결 가능한지 다시 확인
- 정말 필요하면 GitHub Issue로 그 사람과 합의 후 그 사람이 PR
- shared/ 인터페이스 변경이 필요하면 ADR 먼저 (`docs/decisions/TEMPLATE.md`)

## Claude/LLM

### Q. Claude가 자꾸 룰을 어겨요
- 새 채팅 시작했을 가능성. 본인 모듈 폴더 안에서 켰는지 확인
- `cat CLAUDE.md` 로 룰 다시 보여주기
- 그래도 안 되면 `/start-day` 실행

### Q. Claude가 너무 큰 PR을 만들어요
- 작업 시작 시 "한 번에 하나만 해" 명시
- 또는 작업 끝나고 `git diff --stat` 보고 너무 크면 일부 commit 빼고 다시

### Q. Claude가 시크릿(.env, API 키)을 코드에 넣었어요
- 즉시 새 채팅 시작 + `git diff` 로 확인
- 만약 commit/push 됐으면 병승에게 즉시 핑 (`/ask`)
- API 키 회전 필요

### Q. dev mode (mock 응답) 어떻게 켜나요
- `.env` 에서 `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` 둘 다 비우기
- 또는 `LLM_PROVIDER=mock` 추가

## 모듈/스택

### Q. 본인 모듈에 라이브러리 추가 방법
- `pyproject.toml` 의 `dependencies` 에 추가 후 `uv pip install -e ".[dev]"` 다시
- 무거운 라이브러리는 ADR 권장 (`docs/decisions/`)

### Q. 다른 사람 모듈이 아직 안 됐는데 내 거 진행 못 해요?
- mock 사용. `shared.mocks` 의 `mock_market_output()`, `mock_portfolio()`, `mock_analysis_report()`
- 본인 모듈에서 `if dev_mode: return mock_...()` 같이

### Q. Streamlit 써야 하나요? React?
- 본인이 결정. 모듈 owner 자유. 결정하면 `docs/decisions/`에 ADR 남겨두면 좋음

### Q. 한국 주식 종목명이 영문으로 나와요 (yfinance)
- pykrx 추천 (한글 종목명 지원). 노션 [현태스킬](https://www.notion.so/3605be6fc8fd80038ef7cbedc3347828) 페이지 참고

## CI/CD

### Q. PR이 자꾸 fail 해요
- GitHub Actions 탭에서 "Details" 클릭, 빨간 줄 찾기
- 대부분 `ruff check` 실패. 로컬에서 `ruff check . --fix` 후 다시 커밋
- 또는 `pytest` 실패. 로컬에서 `pytest -v` 로 확인

### Q. `ruff check` 가 너무 빡빡해요
- 본인 모듈에선 `# noqa: {룰}` 로 해당 줄 무시 가능 (남용 금지)
- 룰이 진짜 부적절하면 `pyproject.toml`의 `[tool.ruff.lint]` 에서 ignore 추가 + PR (병승 리뷰)
