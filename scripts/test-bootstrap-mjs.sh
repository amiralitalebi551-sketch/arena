#!/usr/bin/env bash
# ============================================================================
#  test-bootstrap-mjs.sh — proves FORM 3, the path you actually paste into
#  ClawCloud: node:22-alpine, NO Command, only two env vars.
#
#     NODE_OPTIONS = --import=data:text/javascript,<boot-loader.js encoded>
#     BOOT_URL     = .../scripts/bootstrap.mjs
#
#  It runs the real loader + the real bootstrap.mjs against a local stand-in for
#  raw.githubusercontent.com, downloads a stand-in xray-core .zip, unzips it,
#  renders the config, starts the supervisor, and then:
#
#     PHASE 2 — kills the "internet" and restarts. The proxy must still come up
#               entirely from the /data cache. That is the "a GitHub outage does
#               not take your VPN down" guarantee.
#
#     bash scripts/test-bootstrap-mjs.sh
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
TMP="$(mktemp -d)"
HTTP=$(( 18600 + RANDOM % 300 ))
FPORT=$(( 18100 + RANDOM % 400 ))
XPORT=$(( 24000 + RANDOM % 8000 ))
DATA="$TMP/data"; APP="$TMP/app"; WWW="$TMP/www"; mkdir -p "$DATA" "$APP" "$WWW/xray"
pass=0; fail=0
ok(){ if [ "$2" = "$3" ]; then pass=$((pass+1)); printf '  PASS  %-58s %s\n' "$1" "$3"; else fail=$((fail+1)); printf '  FAIL  %-58s got %s want %s\n' "$1" "$2" "$3"; fi; }
code(){ curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$@" 2>/dev/null; }
hs(){ local c; c=$(curl -s -i --max-time 6 --http1.1 -H 'Upgrade: websocket' -H 'Connection: Upgrade' -H "Sec-WebSocket-Key: $(head -c16 /dev/urandom|base64)" -H 'Sec-WebSocket-Version: 13' "$@" 2>/dev/null | head -n1 | awk '{print $2}'); case "$c" in ''|*[!0-9]*) c=000;; esac; printf '%s' "$c"; }
cleanup(){ [ -n "${HTTPD:-}" ] && kill $HTTPD 2>/dev/null; [ -n "${P1:-}" ] && kill -TERM -$P1 2>/dev/null; [ -n "${P2:-}" ] && kill -TERM -$P2 2>/dev/null; sleep 0.4; [ -n "${P1:-}" ] && kill -KILL -$P1 2>/dev/null; [ -n "${P2:-}" ] && kill -KILL -$P2 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT

# ---- a fake www root: the repo files + a stand-in xray release -------------
ln -s "$ROOT/server"  "$WWW/server"
ln -s "$ROOT/scripts" "$WWW/scripts"
cat > "$TMP/xray-stub" <<'STUB'
#!/usr/bin/env node
const fs=require('fs'),net=require('net'),crypto=require('crypto');
const a=process.argv.slice(2);
if(a[0]==='version'){console.log('Xray 99.0.0-stub (Mock, linux/amd64)');console.log('20260101-000000');process.exit(0);}
let test=false,cfg=null;
for(let i=0;i<a.length;i++){if(a[i]==='-test')test=true;if(a[i]==='-c')cfg=a[++i];}
const c=JSON.parse(fs.readFileSync(cfg,'utf8'));
const inb=c.inbounds.find(x=>x.protocol==='vless');
if(test){console.log('Configuration OK.');process.exit(0);}
const P=inb.streamSettings.wsSettings.path;
console.error('[stub-xray] listening '+inb.listen+':'+inb.port+' path='+P+' uuid='+inb.settings.clients[0].id);
fs.writeFileSync(process.env.STUB_OUT||'/tmp/stub-xray.json',JSON.stringify({port:inb.port,path:P,listen:inb.listen,uuid:inb.settings.clients[0].id}));
const acc=k=>crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
net.createServer(s=>{let b=Buffer.alloc(0);
 s.on('data',d=>{b=Buffer.concat([b,d]);const i=b.indexOf('\r\n\r\n');if(i===-1)return;
  const h=b.slice(0,i).toString('latin1');const m=/sec-websocket-key:\s*(\S+)/i.exec(h);
  if(!m){s.end('HTTP/1.1 400 Bad Request\r\n\r\n');return;}
  s.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc(m[1])+'\r\n\r\n');
  const rest=b.slice(i+4);if(rest.length)s.write(rest);
  s.removeAllListeners('data');s.on('data',x=>s.write(x));});
 s.on('error',()=>{});}).listen(inb.port,inb.listen);
STUB
python3 - "$TMP/xray-stub" "$WWW/xray/Xray-linux-64.zip" <<'PY'
import sys, zipfile
stub, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(stub, 'xray')
    z.writestr('geoip.dat', 'FAKE-GEOIP-DATA' * 100)
    z.writestr('geosite.dat', 'FAKE-GEOSITE-DATA' * 100)
print('built', out)
PY

# ---- the loader, encoded exactly the way bootstrap-cmd.sh does it ----------
LOADER="$(node -e '
const fs=require("fs");
let s=fs.readFileSync("scripts/boot-loader.js","utf8");
s=s.replace(/\/\*[\s\S]*?\*\//g," ");
s=s.split("\n").map(l=>l.trim()).filter(l=>l && !l.startsWith("//")).join(" ");
process.stdout.write(s.replace(/\s+/g," "));')"
B64="$(printf '%s' "$LOADER" | base64 | tr -d '\n')"
NOPT="--import=data:text/javascript;base64,${B64}"
echo "loader: ${#LOADER} chars   NODE_OPTIONS: ${#NOPT} chars"
printf '%s\n' "$LOADER" > "$TMP/loader.txt"

python3 -m http.server "$HTTP" --bind 127.0.0.1 --directory "$WWW" >"$TMP/http.log" 2>&1 &
HTTPD=$!
sleep 1.5
BASE="http://127.0.0.1:$HTTP"

run_phase(){ # $1 = label, $2 = BOOT_URL, $3 = logfile, $4 = out var name for pid
  env NODE_OPTIONS="$NOPT" BOOT_URL="$2" BOOT_BASE="$BASE" \
      XRAY_VERSION=test XRAY_URL_BASE="$BASE/xray" \
      APP_DIR="$APP" STATE_DIR="$DATA" STUB_OUT="$TMP/stub-xray-$1.json" \
      PORT="$FPORT" XRAY_PORT="$XPORT" PANEL_TOKEN=t0ken \
      UUID="11111111-2222-3333-4444-555555555555" WS_PATH="/override-path" \
      REMARK="mjs-test" IP_SAMPLE_SECONDS=100000 VERIFY_EVERY_MINUTES=100000 \
      setsid node </dev/null >"$3" 2>&1 &
  eval "$4=$!"
}

echo
echo "== PHASE 1: cold boot, everything fetched over HTTP =="
run_phase 1 "$BASE/scripts/bootstrap.mjs" "$TMP/p1.log" P1
sleep 12
sed -n '1,25p' "$TMP/p1.log"
echo "   ..."

B="http://127.0.0.1:$FPORT"
ok "process alive"                    "$([ -n "$(kill -0 $P1 2>/dev/null && echo y)" ] && echo y || echo n)" y
ok "bootstrap.mjs fetched+ran"        "$(grep -c 'server files ready' "$TMP/p1.log")" 1
ok "xray zip downloaded + unzipped"   "$(grep -c 'xray installed' "$TMP/p1.log")" 1
ok "geoip.dat copied to /data"        "$([ -s "$DATA/geoip.dat" ] && echo y || echo n)" y
ok "xray binary cached on the volume" "$([ -x "$DATA/xray" ] && echo y || echo n)" y
ok "loader cached bootstrap.mjs"      "$([ -s "$DATA/bc.mjs" ] && echo y || echo n)" y
ok "front.js cached"                  "$([ -s "$DATA/boot-cache/front.js" ] && echo y || echo n)" y
ok "config rendered"                  "$([ -s "$DATA/xray.json" ] && echo y || echo n)" y
ok "xray -test accepted the config"   "$(grep -c 'config OK' "$TMP/p1.log")" 1
ok "no unhandled crash"               "$(grep -ci 'unhandled' "$TMP/p1.log")" 0
ok "GET /                    -> 404"  "$(code "$B/")" 404
ok "GET /__health            -> 200"  "$(code "$B/__health")" 200
ok "WS handshake on override -> 101"  "$(hs "$B/override-path")" 101
ok "default path is NOT live -> 404"  "$(hs "$B/cf5d72f32b82")" 404
ok "/__ip?t=wrong            -> 404"  "$(code "$B/__ip?t=wrong")" 404
ok "/__sub                   -> 200"  "$(code "$B/__sub?t=t0ken")" 200
SUB="$(curl -s --max-time 8 "$B/__sub?t=t0ken" -H 'Host: myhost.clawcloudrun.com' | base64 -d 2>/dev/null | head -1)"
echo "  link: $SUB"
ok "link has the override uuid"       "$(printf '%s' "$SUB" | grep -c '11111111-2222-3333-4444-555555555555')" 1
ok "link has the override path"       "$(printf '%s' "$SUB" | grep -c 'path=%2Foverride-path')" 1
ok "link address = Host header"       "$(printf '%s' "$SUB" | grep -c '@myhost.clawcloudrun.com:443')" 1

kill -TERM -$P1 2>/dev/null; sleep 1.5; kill -KILL -$P1 2>/dev/null; sleep 0.5

echo
echo "== PHASE 2: restart with the 'internet' DEAD (must come up from /data cache) =="
kill $HTTPD 2>/dev/null; wait $HTTPD 2>/dev/null; HTTPD=""
FPORT=$(( FPORT + 1 )); XPORT=$(( XPORT + 1 )); B="http://127.0.0.1:$FPORT"
run_phase 2 "http://127.0.0.1:1/scripts/bootstrap.mjs" "$TMP/p2.log" P2   # port 1 = dead
sleep 12
sed -n '1,14p' "$TMP/p2.log"
ok "loader fell back to the cache"    "$(grep -c 'cached boot' "$TMP/p2.log")" 1
ok "bootstrap still ran offline"      "$(grep -c 'server files ready' "$TMP/p2.log")" 1
ok "server files came from cache"     "$(grep -c 'cache hit' "$TMP/p2.log")" 3
ok "xray came from cache (no download)" "$(grep -c 'xray cached' "$TMP/p2.log")" 1
ok "process alive"                    "$([ -n "$(kill -0 $P2 2>/dev/null && echo y)" ] && echo y || echo n)" y
ok "GET /                    -> 404"  "$(code "$B/")" 404
ok "GET /__health            -> 200"  "$(code "$B/__health")" 200
ok "WS handshake             -> 101"  "$(hs "$B/override-path")" 101

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ] || exit 1
