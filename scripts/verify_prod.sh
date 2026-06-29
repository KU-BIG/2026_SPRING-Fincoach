#!/usr/bin/env bash
# FinCoach prod demo-readiness smoke test (#136, #137).
# Verifies the live demo path end-to-end against the real backend.
#
#   scripts/verify_prod.sh [BASE_URL]
#   default BASE_URL = https://api.bsghcal.com  (what the frontend's VITE_API_BASE uses;
#   NOT fincoach-api.onrender.com — the bare onrender host is not served, only the
#   api.bsghcal.com custom domain is.)
#
# Run ~2-3 min before a demo. The free-tier instance spins down after 15 min idle;
# this pre-warms it (cold start ~30-60s) and confirms every endpoint serves real data.
# Exit 0 = demo-ready (no FAIL); non-zero = a blocker needs attention.

set -uo pipefail

BASE="${1:-https://api.bsghcal.com}"
TIMEOUT=40
pass=0; warn=0; fail=0

ok()  { printf '  [OK]   %s\n' "$1"; pass=$((pass + 1)); }
wrn() { printf '  [WARN] %s\n' "$1"; warn=$((warn + 1)); }
bad() { printf '  [FAIL] %s\n' "$1"; fail=$((fail + 1)); }

printf 'FinCoach prod smoke test -> %s\n\n' "$BASE"

# 1) pre-warm + health (free-tier cold start can take ~30-60s)
printf '[1/4] health (pre-warm; cold start may take ~50s)\n'
code=000
for i in 1 2 3 4 5 6; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$BASE/api/health" 2>/dev/null || echo 000)
  [ "$code" = "200" ] && break
  printf '    waking... attempt %s (%s)\n' "$i" "$code"
  sleep 5
done
if [ "$code" = "200" ]; then ok "health 200 (warm)"; else bad "health $code -- backend down (check Render)"; fi

# 2) market/summary (real KR+US data via pykrx/yfinance)
printf '[2/4] GET /api/market/summary\n'
body=$(curl -s --max-time "$TIMEOUT" "$BASE/api/market/summary" 2>/dev/null)
if printf '%s' "$body" | grep -q '"market_date"'; then
  ok "market real data ($(printf '%s' "$body" | grep -o '"market_date":"[^"]*"' | head -1))"
else
  bad "market unexpected: ${body:0:120}"
fi

# 3) portfolio/summary (demo holdings calc)
printf '[3/4] GET /api/portfolio/summary\n'
body=$(curl -s --max-time "$TIMEOUT" "$BASE/api/portfolio/summary" 2>/dev/null)
if printf '%s' "$body" | grep -q '"total_value_krw"'; then
  ok "portfolio real data"
else
  bad "portfolio unexpected: ${body:0:120}"
fi

# 4) chat/stream -- real LLM vs demo mode (ANTHROPIC_API_KEY presence)
printf '[4/4] POST /api/chat/stream (real LLM vs demo mode)\n'
body=$(curl -s --max-time "$TIMEOUT" -N -X POST "$BASE/api/chat/stream" \
  -H 'Content-Type: application/json' \
  -d '{"question":"hello","history":[]}' 2>/dev/null)
if printf '%s' "$body" | grep -q '데모 모드'; then
  wrn "chat works but DEMO MODE -- set ANTHROPIC_API_KEY in Render Environment for real LLM"
elif printf '%s' "$body" | grep -q '"delta"'; then
  ok "chat real LLM streaming"
else
  bad "chat unexpected: ${body:0:120}"
fi

printf '\n-- result: PASS %s / WARN %s / FAIL %s --\n' "$pass" "$warn" "$fail"
if [ "$fail" -eq 0 ]; then
  [ "$warn" -eq 0 ] && printf 'demo-ready OK\n' || printf 'demo OK but review WARN\n'
  exit 0
else
  printf 'demo blocker present\n'
  exit 1
fi
