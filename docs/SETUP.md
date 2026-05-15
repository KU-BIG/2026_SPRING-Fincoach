# 환경 셋업

운영체제별 단계. 막히면 [FAQ](FAQ.md) → 그래도 안 되면 `claude /ask-cto`.

## 사전 확인

```bash
python3 --version   # 3.11+ 필요
git --version
```

없으면 아래 해당 OS 섹션 참고.

## Windows (WSL2 권장)

WSL2 미설치 시:
```powershell
wsl --install
```

설치 후 WSL2 (Ubuntu) 안에서:
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv git curl
```

## macOS

```bash
brew install python@3.11 git
```

## 공통 - 프로젝트 셋업

```bash
git clone https://github.com/youdie006/KUBIG_conf3.git fincoach
cd fincoach

# uv 설치 (pip보다 빠른 패키지 매니저)
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env

# 가상환경 + 의존성
uv venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"

# 환경변수
cp .env.example .env
# .env 열어서 OPENAI_API_KEY 또는 ANTHROPIC_API_KEY 채우기 (없으면 mock 모드)
```

## Claude Code 설치

세 가지 옵션. 본인 편한 거 사용:

### 옵션 1: VS Code 확장 (가장 쉬움)
- VS Code 열기
- Extensions → "Claude Code" 검색 → 설치
- 사이드바 아이콘 클릭 → 로그인

### 옵션 2: 터미널 CLI (병승 추천)
```bash
npm install -g @anthropic-ai/claude-code
claude login
```

### 옵션 3: JetBrains IDE
- IDE Plugin Marketplace → "Claude Code" → 설치

## Git 설정

```bash
git config user.name "{본인 이름 - 예: eunseo 또는 은서}"
git config user.email "{본인 이메일}"
```

이름이 영문이면 `wrap-day` 스킬이 자동으로 본인 식별. 한글이어도 매핑됨.

GitHub 계정 인증 (gh CLI 추천):
```bash
brew install gh             # macOS
# 또는 sudo apt install gh   # Ubuntu
gh auth login
```

## 동작 확인

```bash
# 가상환경 활성 상태에서
pytest -q                   # 7개 테스트 통과해야 함
ruff check .                # lint 통과해야 함
python -c "from shared.mocks import mock_market_output; print(mock_market_output().daily_market_summary)"
```

마지막 명령이 시장 브리핑 한 문장 찍으면 OK.

## Claude 켜기

```bash
cd fincoach
claude                      # 또는 VS Code에서 사이드바
```

`CLAUDE.md` 자동 로드됨. 본인 모듈 폴더로 이동해서 켜면 본인 룰까지 추가 로드:

```bash
cd market_intelligence      # 은서
cd portfolio_analyzer       # 현태
cd coach_chat               # 수빈
```

## 첫 작업 시작

```
claude /start-day
```

→ 어제 로그 (첫날은 없음) + main 최신화 + 오늘 할 일 안내.

## 막히면

- [FAQ](FAQ.md) 먼저 보기
- `claude /ask-cto "{질문}"` 으로 Issue 생성
- 또는 직접 GitHub Issue: https://github.com/youdie006/KUBIG_conf3/issues/new
