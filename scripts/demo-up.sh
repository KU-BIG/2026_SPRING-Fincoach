#!/usr/bin/env bash
# 데모 백엔드 + 공개 터널 한 번에 띄우기.
# - uvicorn으로 FastAPI 띄움 (포트 8000)
# - cloudflared quick tunnel로 *.trycloudflare.com URL 발급 (인증 불필요)
# - 발급된 URL을 출력 → Cloudflare Pages > Settings > Environment variables 의
#   VITE_API_BASE 에 붙이고 재배포하면 프론트가 실 API 호출
#
# 사전 준비:
# - .env 파일에 ANTHROPIC_API_KEY=... 설정
# - cloudflared 설치 (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
# - pip install -e . (의존성)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared 미설치. https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" >&2
  exit 1
fi

if [ -f .env ]; then
  set -a; source .env; set +a
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ANTHROPIC_API_KEY 가 없습니다. .env 또는 export 로 설정." >&2
  exit 1
fi

# CORS: Pages 기본 URL + 로컬 dev 허용
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://fincoach-web.pages.dev,http://localhost:5173}"

echo "==> uvicorn 시작 (포트 8000)"
uvicorn api.main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!

cleanup() {
  echo ""
  echo "==> 종료 중"
  kill "$UVICORN_PID" 2>/dev/null || true
  kill "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 2

echo "==> cloudflared quick tunnel 시작"
cloudflared tunnel --url http://localhost:8000 2>&1 | tee /tmp/fincoach-tunnel.log &
TUNNEL_PID=$!

# URL 추출 (로그에 https://xxxx.trycloudflare.com 형태로 찍힘)
echo "==> 터널 URL 대기"
for _ in $(seq 1 30); do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/fincoach-tunnel.log | head -1 || true)
  if [ -n "$URL" ]; then break; fi
  sleep 1
done

if [ -z "${URL:-}" ]; then
  echo "터널 URL 추출 실패. /tmp/fincoach-tunnel.log 확인" >&2
  wait
fi

echo ""
echo "============================================================"
echo " 공개 백엔드 URL: $URL"
echo ""
echo " Cloudflare Pages > fincoach-web > Settings > Environment"
echo " variables > Production 에 다음 추가 후 재배포:"
echo ""
echo "   VITE_API_BASE = $URL/api"
echo ""
echo " 이 창은 띄워둔 상태로 유지하세요. Ctrl+C 로 종료."
echo "============================================================"
echo ""

wait
