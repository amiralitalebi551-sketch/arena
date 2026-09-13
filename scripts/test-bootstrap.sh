#!/usr/bin/env bash
# ============================================================================
#  test-bootstrap.sh — integration test of the ZERO-CI deploy path.
#
#  Simulates exactly what happens inside a ClawCloud container:
#     node:22-alpine  +  `sh -c "curl <repo>/scripts/bootstrap.sh | sh"`
#  The repo is served over localhost (so this runs even in a locked-down box),
#  xray-core is replaced by a stub that reads the RENDERED config and answers
#  the WebSocket handshake — which proves bootstrap -> entrypoint -> render ->
#  front.js all line up, including env overrides.
#
#     bash scripts/test-bootstrap.sh
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
TMP="$(mktemp -d)"
HTTP=$(( 18099 + RANDOM % 800 ))
PORT=$(( 18081 + RANDOM % 400 ))
XPORT=$(( 20000 + RANDOM % 20000 ))
DATA="$TMP/data"; APP="$TMP/app"; mkdir -p "$DATA" "$APP"
pass=0; fail=0
ok(){ if [ "$2" = "$3" ]; then pass=$((pass+1)); printf '  PASS  %-56s %s\n' "$1" "$3"; else fail=$((fail+1)); printf '  FAIL  %-56s got %s want %s\n' "$1" "$2" "$3"; fi; }
code(){ curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$@" 2>/dev/null; }
hs(){ local c; c=$(curl -s -i --max-time 6 --http1.1 -H 'Upgrade: websocket' -H 'Connection: Upgrade' -H "Sec-WebSocket-Key: $(head -c16 /dev/urandom|base64)" -H 'Sec-WebSocket-Version: 13' "$@" 2>/dev/null | head -n1 | awk '{print $2}'); case "$c" in ''|*[!0-9]*) c=000;; esac; printf '%s' "$c"; }

echo "== serving the repo on 127.0.0.1:$HTTP (stands in for raw.githubusercontent) =="
python3 -m http.server "$HTTP" --bind 127.0.0.1 --directory "$ROOT" >"$TMP/http.log" 2>&1 &
HTTPD=$!
sleep 1.5
cleanup(){ kill $HTTPD 2>/dev/null; [ -n "${BOOT:-}" ] && kill -TERM -"$BOOT" 2>/dev/null; sleep 0.5; [ -n "${BOOT:-}" ] && kill -KILL -"$BOOT" 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT

echo "== planting the stub xray at $DATA/xray =="
cat > "$DATA/xray" <<'STUB'
#!/usr/bin/env node
const fs=require('fs'),net=require('net'),crypto=require('crypto');
const a=process.argv.slice(2);
if(a[0]==='version'){console.log('Xray 99.0.0-stub (Mock, linux/amd64)');console.log('20260101-000000');process.exit(0);}
let test=false,cfg=null;
for(let i=0;i<a.length;i++){if(a[i]==='-test')test=true;if(a[i]==='-c')cfg=a[++i];}
const c=JSON.parse(fs.readFileSync(cfg,'utf8'));
const inb=c.inbounds.find(x=>x.protocol==='vless');
if(test){
  const errs=[];
  if(!inb)errs.push('no vless inbound');
  if(!c.outbounds||c.outbounds.length<2)errs.push('need freedom+blackhole');
  if(!cfg.endsWith('xray.json'))errs.push('unexpected config path');
  if(errs.length){console.error('Configuration NOT OK: '+errs.join(', '));process.exit(1);}
  console.log('Configuration OK.');process.exit(0);
}
const P=inb.streamSettings.wsSettings.path;
console.error('[stub-xray] listening '+inb.listen+':'+inb.port+' path='+P+' uuid='+inb.settings.clients[0].id);
fs.writeFileSync(process.env.STUB_OUT||'/tmp/stub-xray.json',JSON.stringify({port:inb.port,path:P,listen:inb.listen,uuid:inb.settings.clients[0].id,clients:inb.settings.clients.length}));
const acc=(k)=>crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
net.createServer((s)=>{let b=Buffer.alloc(0);
  s.on('data',(d)=>{b=Buffer.concat([b,d]);const i=b.indexOf('\r\n\r\n');if(i===-1)return;
    const h=b.slice(0,i).toString('latin1');const m=/sec-websocket-key:\s*(\S+)/i.exec(h);
    if(!m){s.end('HTTP/1.1 400 Bad Request\r\n\r\n');return;}
    s.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc(m[1])+'\r\n\r\n');
    const rest=b.slice(i+4);if(rest.length)s.write(rest);
    s.removeAllListeners('data');s.on('data',(x)=>s.write(x));});
  s.on('error',()=>{});}).listen(inb.port,inb.listen);
STUB
chmod +x "$DATA/xray"
"$DATA/xray" version | head -1

echo
echo "== running bootstrap.sh (this is the container's Command) =="
BOOT_BASE="http://127.0.0.1:$HTTP" APP_DIR="$APP" STATE_DIR="$DATA" STUB_OUT="$TMP/stub-xray.json" \
  PORT="$PORT" XRAY_PORT="$XPORT" PANEL_TOKEN=t0ken \
  UUID="11111111-2222-3333-4444-555555555555" WS_PATH="/override-path" \
  REMARK="boot-test" IP_SAMPLE_SECONDS=100000 VERIFY_EVERY_MINUTES=100000 \
  setsid sh scripts/bootstrap.sh >"$TMP/boot.log" 2>&1 &
BOOT=$!
sleep 6

echo "--- boot log ---"; sed -n '1,40p' "$TMP/boot.log"
echo "----------------"

echo
echo "== assertions =="
ok "bootstrap is alive"                 "$([ -n "$(kill -0 $BOOT 2>/dev/null && echo y)" ] && echo y || echo n)" "y"
ok "front.js fetched"                   "$([ -s "$APP/front.js" ] && echo y || echo n)" "y"
ok "config.json fetched"                "$([ -s "$APP/config.json" ] && echo y || echo n)" "y"
ok "entrypoint.sh fetched"              "$([ -s "$APP/entrypoint.sh" ] && echo y || echo n)" "y"
ok "rendered \$DATA/xray.json exists"    "$([ -s "$DATA/xray.json" ] && echo y || echo n)" "y"
grep -q 'config OK' "$TMP/boot.log" && ok "xray -test accepted the rendered config" y y || ok "xray -test accepted the rendered config" n y
grep -qi 'unhandled\|FATAL\|Traceback' "$TMP/boot.log" && ok "no fatal errors in boot log" n y || ok "no fatal errors in boot log" y y

STUB_JSON="$TMP/stub-xray.json"
if [ -s "$STUB_JSON" ]; then
  ok "stub xray read path override"   "$(sed -n 's/.*"path":"\([^"]*\)".*/\1/p' "$STUB_JSON")" "/override-path"
  ok "stub xray read uuid override"   "$(sed -n 's/.*"uuid":"\([^"]*\)".*/\1/p' "$STUB_JSON")" "11111111-2222-3333-4444-555555555555"
  ok "stub xray bound to loopback"    "$(sed -n 's/.*"listen":"\([^"]*\)".*/\1/p' "$STUB_JSON")" "127.0.0.1"
fi

B="http://127.0.0.1:$PORT"
ok "GET /                       -> 404" "$(code "$B/")" "404"
ok "GET /__health               -> 200" "$(code "$B/__health")" "200"
ok "GET old default path        -> 404" "$(hs "$B/cf5d72f32b82")" "404"
ok "GET override path no-upgrade-> 400" "$(code "$B/override-path")" "400"
ok "WS handshake override path  -> 101" "$(hs "$B/override-path")" "101"
ok "GET /__ip?t=wrong           -> 404" "$(code "$B/__ip?t=wrong")" "404"
ok "GET /__ip?t=t0ken           -> 200" "$(code "$B/__ip?t=t0ken")" "200"
ok "GET /__sub                  -> 200" "$(code "$B/__sub?t=t0ken")" "200"

SUB="$(curl -s --max-time 8 "$B/__sub?t=t0ken" -H 'Host: myhost.clawcloudrun.com')"
DEC="$(printf '%s' "$SUB" | base64 -d 2>/dev/null | head -1)"
echo "  first link: $DEC"
ok "link uses the OVERRIDE uuid"   "$(printf '%s' "$DEC" | grep -c '11111111-2222-3333-4444-555555555555')" "1"
ok "link uses the OVERRIDE path"   "$(printf '%s' "$DEC" | grep -c 'path=%2Foverride-path')" "1"
ok "link address = Host header"    "$(printf '%s' "$DEC" | grep -c '@myhost.clawcloudrun.com:443')" "1"

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ] || exit 1
