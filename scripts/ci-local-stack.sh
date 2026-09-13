#!/usr/bin/env bash
# ============================================================================
#  ci-local-stack.sh — FULL end-to-end proof on a GitHub Actions runner.
#
#  Builds the same chain you will run in production, on one box:
#
#      xray-client(SOCKS 10808) --TLS--> front.js:8443 --plain WS--> xray-server --> internet
#      xray-client(SOCKS 10809) ------------ plain WS --> front.js:8080 -> xray-server --> internet
#
#  The 8443 path proves the client-side link (TLS + SNI + fp=chrome + alpn + WS path).
#  The 8080 path proves the ClawCloud/Cloudflare shape (platform terminates TLS,
#  container only sees plain WebSocket).
#  Then it runs scripts/verify.sh (the §5 protocol) through the real internet.
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
WORK="${WORK:-$(mktemp -d)}"
mkdir -p "$WORK"
UUID="${UUID:-bac2db35-df5b-47e1-a8e1-19ecd81c1ed5}"
WSPATH="${WSPATH:-/cf5d72f32b82}"
TOKEN="${PANEL_TOKEN:-ci-test-token}"
X="${WORK}/xray"
say(){ printf '\n=== %s\n' "$1"; }
die(){ printf '\nFATAL: %s\n' "$1" >&2; tail -n 40 "$WORK"/*.log 2>/dev/null; exit 1; }

# ------------------------------------------------------------ 0) get xray
say "0) xray-core"
VER="${XRAY_VERSION:-latest}"
if [ "$VER" = latest ]; then
  VER="$(curl -fsSL https://api.github.com/repos/XTLS/Xray-core/releases/latest | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
fi
[ -n "$VER" ] || die "could not resolve xray version"
for n in Xray-linux-64.zip Xray-linux-amd64.zip; do
  if curl -fsSL --retry 3 -o "$WORK/x.zip" "https://github.com/XTLS/Xray-core/releases/download/${VER}/${n}"; then break; fi
done
[ -s "$WORK/x.zip" ] || die "download failed"
unzip -oq "$WORK/x.zip" -d "$WORK/xbin"
install -m0755 "$WORK/xbin/xray" "$X"
export XRAY_LOCATION_ASSET="$WORK/xbin"
"$X" version | head -2
echo "version: $VER" | tee "$WORK/00-version.txt"

# ------------------------------------------------------- 1) validate config
say "1) validate server config.json"
"$X" run -test -c server/config.json || die "server/config.json is INVALID"
echo "server config: OK"

# ------------------------------------------------------------ 2) self-sign
say "2) self-signed cert for test.local (emulates the platform ingress)"
openssl req -x509 -newkey rsa:2048 -nodes -days 2 -keyout "$WORK/key.pem" -out "$WORK/cert.pem" \
  -subj "/CN=test.local" -addext "subjectAltName=DNS:test.local,IP:127.0.0.1" >/dev/null 2>&1 \
  || die "openssl failed"
echo "cert ok"

# ----------------------------------------------------------- 3) start stack
say "3) start xray server + front.js"
WORK="$WORK" UUID="$UUID" WS_PATH="$WSPATH" node -e '
const fs=require("fs");
const c=JSON.parse(fs.readFileSync("server/config.json","utf8"));
const i=c.inbounds[0];
i.settings.clients[0].id=process.env.UUID;
i.streamSettings.wsSettings.path=process.env.WS_PATH;
fs.writeFileSync(process.env.WORK+"/server-runtime.json",JSON.stringify(c,null,2));
console.log("[ci] rendered runtime server config");' || die "render failed"

"$X" run -c "$WORK/server-runtime.json" >"$WORK/server.log" 2>&1 &
SRV=$!
sleep 2
kill -0 $SRV 2>/dev/null || die "xray server died on boot"

PORT=8080 TLS_PORT=8443 TLS_CERT="$WORK/cert.pem" TLS_KEY="$WORK/key.pem" \
  XRAY_PORT=2087 WS_PATH="$WSPATH" UUID="$UUID" PANEL_TOKEN="$TOKEN" \
  IP_SAMPLE_SECONDS=60 STATE_FILE="$WORK/ip-state.json" REMARK="ci-test" \
  node server/front.js >"$WORK/front.log" 2>&1 &
FRONT=$!
sleep 3
kill -0 $FRONT 2>/dev/null || die "front.js died on boot"
cat "$WORK/front.log"

# --------------------------------------------------------- 4) sanity checks
say "4) endpoint sanity (plain 8080 + tls 8443)"
WSKEY="$(head -c16 /dev/urandom | base64)"
c_plain(){ curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$@" 2>/dev/null; }
c_tls(){ curl -s -k -o /dev/null -w '%{http_code}' --max-time 8 --resolve "test.local:8443:127.0.0.1" "$@" 2>/dev/null; }
hs_plain(){ local c; c=$(curl -s -i --max-time 6 --http1.1 -H 'Upgrade: websocket' -H 'Connection: Upgrade' -H "Sec-WebSocket-Key: $WSKEY" -H 'Sec-WebSocket-Version: 13' "$@" 2>/dev/null | head -n1 | awk '{print $2}'); case "$c" in ''|*[!0-9]*) c=000;; esac; printf '%s' "$c"; }
hs_tls(){ local c; c=$(curl -s -k -i --max-time 6 --http1.1 --resolve "test.local:8443:127.0.0.1" -H 'Upgrade: websocket' -H 'Connection: Upgrade' -H "Sec-WebSocket-Key: $WSKEY" -H 'Sec-WebSocket-Version: 13' "$@" 2>/dev/null | head -n1 | awk '{print $2}'); case "$c" in ''|*[!0-9]*) c=000;; esac; printf '%s' "$c"; }
check(){ if [ "$2" = "$3" ]; then printf '  %-44s %-4s PASS\n' "$1" "$2"; else printf '  %-44s %-4s FAIL (want %s)\n' "$1" "$2" "$3"; FAILS=$((FAILS+1)); fi; }
FAILS=0
check "plain GET /"                     "$(c_plain http://127.0.0.1:8080/)"                 404
check "plain GET $WSPATH (no upgrade)"   "$(c_plain http://127.0.0.1:8080$WSPATH)"           400
check "plain WS handshake $WSPATH"       "$(hs_plain http://127.0.0.1:8080$WSPATH)"          101
check "plain GET /__health"             "$(c_plain http://127.0.0.1:8080/__health)"          200
check "plain GET /__ip (bad token)"     "$(c_plain "http://127.0.0.1:8080/__ip?t=nope")"     404
check "tls   GET /"                     "$(c_tls https://test.local:8443/)"                  404
check "tls   WS handshake"              "$(hs_tls https://test.local:8443$WSPATH)"           101
check "tls   GET /__health"             "$(c_tls https://test.local:8443/__health)"          200
check "tls   GET /__ip (good token)"    "$(c_tls "https://test.local:8443/__ip?t=$TOKEN")"   200
echo "  sanity failures: $FAILS"
echo "$FAILS" > "$WORK/sanity-fails.txt"

say "4b) /__ip output (egress-IP watchdog)"
curl -s -k --max-time 10 --resolve "test.local:8443:127.0.0.1" "https://test.local:8443/__ip?t=$TOKEN" | tee "$WORK/ip.json"
echo

say "4c) /__sub output (subscription served by the container)"
curl -s -k --max-time 10 --resolve "test.local:8443:127.0.0.1" "https://test.local:8443/__sub?t=$TOKEN" | tee "$WORK/sub.b64"
echo; echo "  decoded:"
base64 -d "$WORK/sub.b64" 2>/dev/null | tee "$WORK/sub.txt" || true

# ------------------------------------------------------- 5) client (TLS)
say "5) xray CLIENT via TLS 8443  (this is your vless:// link, literally)"
ADDR=test.local PORT=8443 SNI=test.local HOST=test.local WS_PATH="$WSPATH" \
UUID="$UUID" SECURITY=tls INSECURE=1 FP=chrome ALPN=http/1.1 SOCKS_PORT=10808 \
  node scripts/render-client.js "$WORK/client-tls.json" || die "render-client failed"
"$X" run -test -c "$WORK/client-tls.json" || die "client config INVALID"
"$X" run -c "$WORK/client-tls.json" >"$WORK/client-tls.log" 2>&1 &
CT=$!
sleep 3
kill -0 $CT 2>/dev/null || die "tls client died"

say "6) §5 PROTOCOL through the TLS client (SOCKS 10808)"
SOCKS=127.0.0.1:10808 ROUNDS="${ROUNDS:-6}" SLEEP_BETWEEN=1 bash scripts/verify.sh 2>&1 | tee "$WORK/verify-tls.txt"

# ---------------------------------------------------- 7) client (plain WS)
say "7) xray CLIENT via PLAIN 8080 (ClawCloud shape: ingress terminates TLS)"
ADDR=127.0.0.1 PORT=8080 SNI=test.local HOST=test.local \
WS_PATH="$WSPATH" UUID="$UUID" SECURITY=none SOCKS_PORT=10809 \
  node scripts/render-client.js "$WORK/client-plain.json" || die "render-client failed"
"$X" run -c "$WORK/client-plain.json" >"$WORK/client-plain.log" 2>&1 &
CP=$!
sleep 3
kill -0 $CP 2>/dev/null || die "plain client died"
SOCKS=127.0.0.1:10809 ROUNDS="${ROUNDS:-6}" SLEEP_BETWEEN=1 bash scripts/verify.sh 2>&1 | tee "$WORK/verify-plain.txt"

# ------------------------------------------------------------- 8) wrap up
say "8) done"
echo "workdir: $WORK"
kill $CT $CP $FRONT $SRV 2>/dev/null || true
if [ "$FAILS" != "0" ]; then echo "SANITY FAILURES: $FAILS"; exit 1; fi
grep -q 'OVERALL        : PASS' "$WORK/verify-tls.txt"  || { echo "TLS-path verification did not PASS"; exit 1; }
grep -q 'OVERALL        : PASS' "$WORK/verify-plain.txt" || { echo "PLAIN-path verification did not PASS"; exit 1; }
echo "ALL GREEN ✅  (both TLS and plain-WS paths carried real traffic)"
