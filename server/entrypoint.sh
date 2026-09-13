#!/bin/sh
# ============================================================================
#  entrypoint.sh — render the Xray config from env, supervise Xray, then become
#  the front router (PID 1). Used both by the Docker image and by bootstrap.sh.
#
#  env: APP_DIR (default /app) · STATE_DIR (default /data) · XRAY_BIN
#       UUID · WS_PATH · XRAY_PORT · XRAY_LISTEN · EXTRA_CLIENTS
# ============================================================================
set -eu

# Belt and braces: never let an inherited NODE_OPTIONS re-trigger a boot loader
# in the child node processes we spawn below.
unset NODE_OPTIONS || true

APP="${APP_DIR:-/app}"
DATA="${STATE_DIR:-/data}"
mkdir -p "$DATA" 2>/dev/null || DATA=/tmp
CFG="$DATA/xray.json"

if [ -n "${XRAY_BIN:-}" ] && [ -x "$XRAY_BIN" ]; then
  X="$XRAY_BIN"
else
  X="$(command -v xray || echo /usr/local/bin/xray)"
fi

echo "[entrypoint] xray : $("$X" version 2>/dev/null | head -1 || echo unknown)  ($X)"
echo "[entrypoint] uuid : ${UUID:-bac2db35-df5b-47e1-a8e1-19ecd81c1ed5}"
echo "[entrypoint] ws   : ${WS_PATH:-/cf5d72f32b82}"
echo "[entrypoint] ports: public=${PORT:-80}  xray=${XRAY_PORT:-2087}  tls=${TLS_PORT:-off}"

# ---- render config.json, applying env overrides ----------------------------
APP="$APP" CFG="$CFG" node -e '
const fs = require("fs");
const c = JSON.parse(fs.readFileSync(process.env.APP + "/config.json", "utf8"));
const inb = c.inbounds.find(i => i.protocol === "vless") || c.inbounds[0];
inb.listen = process.env.XRAY_LISTEN || "127.0.0.1";
if (process.env.XRAY_PORT) inb.port = parseInt(process.env.XRAY_PORT, 10);
if (process.env.UUID) inb.settings.clients[0].id = process.env.UUID.trim();
if (process.env.WS_PATH) {
  let p = process.env.WS_PATH.trim();
  if (!p.startsWith("/")) p = "/" + p;
  inb.streamSettings.wsSettings.path = p;
}
if (process.env.EXTRA_CLIENTS) {
  for (const id of process.env.EXTRA_CLIENTS.split(",").map(s => s.trim()).filter(Boolean)) {
    if (!inb.settings.clients.some(c => c.id === id)) {
      inb.settings.clients.push({ id, level: 0, email: id.slice(0, 8) });
    }
  }
}
fs.writeFileSync(process.env.CFG, JSON.stringify(c, null, 2));
console.log("[entrypoint] rendered " + process.env.CFG + " (" + inb.settings.clients.length + " client(s), path " + inb.streamSettings.wsSettings.path + ")");
'

"$X" run -test -c "$CFG" >/dev/null && echo "[entrypoint] config OK"

# ---- supervise: xray dies -> back in 2s ------------------------------------
(
  BACKOFF=2
  while true; do
    echo "[supervisor] xray up $(date -u +%FT%TZ)"
    "$X" run -c "$CFG" || echo "[supervisor] xray exited $?"
    # crash-loop protection: back off to 30s max instead of hammering the log
    sleep "$BACKOFF"
    [ "$BACKOFF" -lt 30 ] && BACKOFF=$(( BACKOFF * 2 ))
  done
) &

# front.js is PID 1. If it dies the container exits and the platform restarts it.
exec node "$APP/front.js"
