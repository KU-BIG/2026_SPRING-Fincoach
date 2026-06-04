# 배포 가이드

전략 결정: [ADR 0010](decisions/0010-deployment-strategy.md)

요약: 프론트엔드 → Cloudflare Pages, 백엔드 → 로컬 또는 Cloudflare Tunnel (데모 시).

## 1. 프론트엔드 (Cloudflare Pages)

### 1.1 Cloudflare 콘솔 1회 셋업

1. Cloudflare 대시보드 → Workers & Pages → Create application → Pages → Connect to Git
2. 리포 선택: `youdie006/KUBIG_conf3`
3. 프로젝트 이름: `fincoach` (`.github/workflows/deploy-web.yml`의 projectName과 일치)
4. 빌드 설정
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `web`
5. 환경변수 (Production)
   - `VITE_API_BASE` = `https://api.{도메인}` (Tunnel 또는 별도 백엔드 origin)
6. Save and Deploy

### 1.2 GitHub Secrets 등록 (CI 자동 배포용)

리포 → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN`: 대시보드 → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" 템플릿 사용
- `CLOUDFLARE_ACCOUNT_ID`: 대시보드 우측 사이드바에서 복사

등록 후 `.github/workflows/deploy-web.yml`이 main push 시 자동 배포.

### 1.3 도메인 연결

Pages 프로젝트 → Custom domains → Add a custom domain → 보유 도메인 입력.
DNS는 자동 추가됨 (도메인이 같은 Cloudflare 계정이면).

## 2. 백엔드 (로컬 + Cloudflare Tunnel)

### 2.1 로컬 실행

```bash
cp .env.example .env
# .env 채우기: ANTHROPIC_API_KEY 등

uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

헬스체크: `http://localhost:8000/api/health` → `{"status":"ok"}`

### 2.2 Cloudflare Tunnel (데모 시연)

도메인이 Cloudflare에 있으면 별도 서버 없이 로컬 백엔드를 인터넷에 노출 가능.

#### 설치

```bash
# Ubuntu/WSL
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# macOS
brew install cloudflared
```

#### 인증

```bash
cloudflared tunnel login
```

브라우저 인증 → 도메인 인증서 저장.

#### Tunnel 생성

```bash
cloudflared tunnel create fincoach-api
```

UUID 출력됨. `~/.cloudflared/<UUID>.json` 자격 증명 저장.

#### 설정 파일

`~/.cloudflared/config.yml`:

```yaml
tunnel: <UUID>
credentials-file: /home/{user}/.cloudflared/<UUID>.json

ingress:
  - hostname: api.{도메인}
    service: http://localhost:8000
  - service: http_status:404
```

#### DNS 라우팅

```bash
cloudflared tunnel route dns fincoach-api api.{도메인}
```

#### 실행

```bash
cloudflared tunnel run fincoach-api
```

이제 `https://api.{도메인}/api/health` 접속 가능.

### 2.3 백엔드 환경변수 (운영용)

`.env`에 추가:

```
ALLOWED_ORIGINS=https://{도메인},https://fincoach.pages.dev
```

쉼표로 구분. 변경 후 uvicorn 재시작.

## 3. 시연 체크리스트

데모 직전:

- [ ] 백엔드 실행: `uvicorn api.main:app --port 8000`
- [ ] Tunnel 실행: `cloudflared tunnel run fincoach-api`
- [ ] 헬스체크 확인: `curl https://api.{도메인}/api/health`
- [ ] 프론트엔드 접속 확인: `https://{도메인}` → 채팅/대시보드 정상 표시
- [ ] 챗 요청 정상 응답 확인

## 4. 장애 대응

- 채팅 503: `ANTHROPIC_API_KEY` 누락 → `.env` 확인 + 재시작
- 채팅 CORS 에러: `ALLOWED_ORIGINS`에 프론트 도메인 누락 → 추가 후 재시작
- Tunnel 끊김: `cloudflared tunnel run` 재실행
- Pages 빌드 실패: Actions 탭에서 로그 확인 (대부분 npm/Node 버전 또는 secrets 누락)

## 5. 상시 운영 옵션 (후속)

데모 안정성 확보 후 검토:

- Render Web Service (Python) — 무료 티어, cold-start 있음
- Fly.io — 더 빠름, 신용카드 등록 필요
- 자체 VPS — 시간 + 비용

ADR 0010 후속으로 결정.
