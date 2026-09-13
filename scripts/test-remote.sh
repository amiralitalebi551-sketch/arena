#!/usr/bin/env bash
# ============================================================================
#  test-remote.sh — test a REAL deployed endpoint, end to end, from anywhere.
#
#  usage:
#    HOST=myapp-xxxx.ap-xxx.clawcloudrun.com bash scripts/test-remote.sh
#    HOST=... ADDR=104.17.147.22 bash scripts/test-remote.sh      # dial a clean CF IP
#    HOST=... PANEL_TOKEN=xxxx bash scripts/test-remote.sh
#
#  It does three things and cross-checks them:
#    A) asks the CONTAINER what egress IP it sees      (/__ip)
#    B) asks the INTERNET what egress IP it sees       (through the proxy)
#    A must equal B, and B must not move.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
HOST="${HOST:-${1:-}}"; HOST="${HOST#https://}"; HOST="${HOST%%/*}"
[ -z "$HOST" ] && { echo "HOST=<your-hostname> bash scripts/test-remote.sh"; exit 2; }

UUID="${UUID:-bac2db35-df5b-47e1-a8e1-19ecd81c1ed5}"
WSPATH="${WSPATH:-/cf5d72f32b82}"
TOKEN="${PANEL_TOKEN:-cf5d72f32b82}"
ADDR="${ADDR:-$HOST}"          # what the client dials (clean IP or hostname)
PORT="${PORT:-443}"
ROUNDS="${ROUNDS:-10}"
BIN="${BIN:-$PWD/.bin}"
say(){ printf '\n=== %s\n' "$1"; }

say "A) container self-report"
curl -s --max-time 15 "https://$HOST/__health" && echo || echo "(no /__health)"
SERVER_JSON="$(curl -s --max-time 15 "https://$HOST/__ip?t=$TOKEN")"
if [ -n "$SERVER_JSON" ]; then
  echo "$SERVER_JSON"
  SERVER_IP="$(printf '%s' "$SERVER_JSON" | sed -n 's/.*"egressIP"[^"]*"\([^"]*\)".*/\1/p' | head -1)"
else
  SERVER_IP=""; echo "  (could not read /__ip — wrong token, or old image)"
fi

say "B) endpoint sanity"
WSPATH="$WSPATH" bash scripts/check-endpoint.sh "$HOST" "$WSPATH"

say "C) xray client"
[ -x "$BIN/xray" ] || bash scripts/get-xray.sh "$BIN" >/dev/null
X="$BIN/xray"; export XRAY_LOCATION_ASSET="$BIN"
mkdir -p "$BIN"
ADDR="$ADDR" PORT="$PORT" SNI="$HOST" HOST_HDR_UNUSED=1 \
  SNI="$HOST" HOST="$HOST" WS_PATH="$WSPATH" UUID="$UUID" SECURITY=tls \
  FP="${FP:-chrome}" ALPN="${ALPN:-http/1.1}" SOCKS_PORT="${SOCKS_PORT:-10808}" \
  node scripts/render-client.js "$BIN/client.json"
"$X" run -test -c "$BIN/client.json" || exit 1
"$X" run -c "$BIN/client.json" >"$BIN/client.log" 2>&1 &
CPID=$!
trap 'kill $CPID 2>/dev/null || true' EXIT
sleep 4
kill -0 $CPID 2>/dev/null || { echo "client died:"; cat "$BIN/client.log"; exit 1; }

say "D) §5 protocol through the real proxy"
SOCKS="127.0.0.1:${SOCKS_PORT:-10808}" ROUNDS="$ROUNDS" SLEEP_BETWEEN="${SLEEP_BETWEEN:-2}" bash scripts/verify.sh

say "E) cross-check"
CLIENT_IP="$(curl -s --socks5-hostname 127.0.0.1:${SOCKS_PORT:-10808} --max-time 15 https://api.ipify.org)"
echo "  container says : ${SERVER_IP:-unknown}"
echo "  internet says  : ${CLIENT_IP:-unknown}"
if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" = "$CLIENT_IP" ]; then
  echo "  MATCH ✅  (your traffic really leaves from the IP the container reports)"
else
  echo "  mismatch/unknown ⚠️"
fi
echo
echo "restart the container now, wait ~60s, then re-run this script."
echo "If 'internet says' is the same IP after the restart -> static. If not -> not static."
say "your links"
PROXY_HOST="$HOST" PANEL_TOKEN="$TOKEN" UUID="$UUID" WSPATH="$WSPATH" bash scripts/make-link.sh "$HOST"
