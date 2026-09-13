#!/bin/sh
# Container entrypoint: render the Xray config, supervise Xray, then become the front router.
set -eu

APP=/app
DATA="${STATE_DIR:-/data}"
mkdir -p "$DATA" 2>/dev/null || DATA=/tmp
CFG="$DATA/xray.json"

XRAY_BIN="$(command -v xray || echo /usr/local/bin/xray)"

echo "[entrypoint] xray: $("$XRAY_BIN" version 2>/dev/null | head -1 || echo unknown)"
echo "[entrypoint] uuid: ${UUID:-bac2db35-df5b-47e1-a8e1-19ecd81c1ed5}"
echo "[entrypoint] ws  : ${WS_PATH:-/cf5d72f32b82}   xray port: ${XRAY_PORT:-2087}   public port: ${PORT:-80}"

# Render config.json, applying env overrides (UUID / WS_PATH / XRAY_PORT / EXTRA_CLIENTS).
node -e '
const fs = require("fs");
const c = JSON.parse(fs.readFileSync("/app/config.json", "utf8"));
const inb = c.inbounds.find(i => i.protocol === "vless") || c.inbounds[0];
inb.listen = process.env.XRAY_LISTEN || "127.0.0.1";
inb.port = parseInt(process.env.XRAY_PORT || String(inb.port), 10);
if (process.env.UUID) inb.settings.clients[0].id = process.env.UUID.trim();
if (process.env.WS_PATH) {
  let p = process.env.WS_PATH.trim();
  if (!p.startsWith("/")) p = "/" + p;
  inb.streamSettings.wsSettings.path = p;
}
// EXTRA_CLIENTS="uuid1,uuid2" -> extra VLESS clients (friends / second device)
if (process.env.EXTRA_CLIENTS) {
  for (const id of process.env.EXTRA_CLIENTS.split(",").map(s => s.trim()).filter(Boolean)) {
    if (!inb.settings.clients.some(c => c.id === id)) inb.settings.clients.push({ id, level: 0, email: id.slice(0, 8) });
  }
}
fs.writeFileSync(process.argv[1], JSON.stringify(c, null, 2));
console.log("[entrypoint] rendered " + process.argv[1] + " with " + inb.settings.clients.length + " client(s)");
' "$CFG"

# Validate before we ever try to serve traffic.
"$XRAY_BIN" run -test -c "$CFG" >/dev/null && echo "[entrypoint] config OK"

# Supervise Xray: if it ever dies, bring it back in 2s. (front.js is PID 1; if *it*
# dies the container exits and the platform restarts it, which is what we want.)
(
  while true; do
    echo "[supervisor] starting xray $(date -u +%FT%TZ)"
    "$XRAY_BIN" run -c "$CFG" || echo "[supervisor] xray exited with $?"
    sleep 2
  done
) &

exec node "$APP/front.js"
