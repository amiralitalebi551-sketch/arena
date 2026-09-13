#!/bin/sh
# ============================================================================
#  bootstrap.sh — the ZERO-CI path.
#
#  Turns a stock `node:22-alpine` container into the full VLESS+WS server:
#  fetches front.js / config.json / entrypoint.sh from this repo, downloads
#  xray-core, then starts the supervisor. Nothing to build, no registry, no
#  GitHub Actions, no credit card.
#
#  Used as the "Command" of a ClawCloud App Launchpad app:
#      sh -c <bootstrap-cmd.sh output>
#  Run `bash scripts/bootstrap-cmd.sh` to get the exact string to paste.
#
#  Caches xray under the mounted volume, so a restart boots in ~2s not ~20s.
# ============================================================================
set -eu

REPO="${BOOT_REPO:-amiralitalebi551-sketch/arena}"
REF="${BOOT_REF:-arena/01a09a53-arena}"
BASE="${BOOT_BASE:-https://raw.githubusercontent.com/${REPO}/${REF}}"
APP="${APP_DIR:-/app}"
DATA="${STATE_DIR:-/data}"

mkdir -p "$DATA" 2>/dev/null || DATA=/tmp/clawdata
mkdir -p "$DATA" "$APP"

echo "[boot] base=$BASE app=$APP data=$DATA"

# --- http helper (curl if present, else busybox wget) -----------------------
dl() { # dl <url> <out>
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 --max-time 120 -o "$2" "$1"
  else
    wget -q -T 30 -t 3 -O "$2" "$1"
  fi
}
to_stdout() {
  if command -v curl >/dev/null 2>&1; then curl -fsSL --retry 3 --max-time 60 "$1"
  else wget -q -T 30 -t 3 -O - "$1"; fi
}

# --- 1) server files (cached in the volume: a GitHub hiccup must not kill a
#         restart, and BOOT_FORCE=1 re-fetches on purpose) -------------------
CACHE="$DATA/boot-cache"; mkdir -p "$CACHE"
if [ "${BOOT_FORCE:-0}" != "1" ] && [ -s "$CACHE/front.js" ] && [ -s "$CACHE/config.json" ] && [ -s "$CACHE/entrypoint.sh" ]; then
  echo "[boot] using cached server files from $CACHE (BOOT_FORCE=1 to re-fetch)"
elif ! dl "$BASE/server/front.js" "$CACHE/.probe" 2>/dev/null; then
  echo "[boot] first fetch failed — installing curl + CA certs and retrying"
  apk add --no-cache curl ca-certificates >/dev/null 2>&1 || true
  dl "$BASE/server/front.js" "$CACHE/.probe" || { echo "[boot] FATAL: cannot reach $BASE"; exit 1; }
fi
rm -f "$CACHE/.probe"
for f in front.js config.json entrypoint.sh; do
  if [ "${BOOT_FORCE:-0}" = "1" ] || [ ! -s "$CACHE/$f" ]; then
    dl "$BASE/server/$f" "$CACHE/$f" || echo "[boot] WARN: re-fetch of $f failed, keeping cache"
  fi
  cp "$CACHE/$f" "$APP/$f"
  [ -s "$APP/$f" ] || { echo "[boot] FATAL: no copy of $f (fetch failed and no cache)"; exit 1; }
done
chmod 0755 "$APP/entrypoint.sh"
echo "[boot] server files ready in $APP"

# --- 2) xray-core (cached in $DATA) ----------------------------------------
XRAY="$DATA/xray"
if [ -x "$XRAY" ] && "$XRAY" version >/dev/null 2>&1; then
  echo "[boot] xray cached: $("$XRAY" version | head -1)"
else
  VER="${XRAY_VERSION:-latest}"
  if [ "$VER" = "latest" ]; then
    VER="$(to_stdout https://api.github.com/repos/XTLS/Xray-core/releases/latest \
           | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  fi
  [ -n "$VER" ] || { echo "[boot] FATAL: cannot resolve xray version"; exit 1; }
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64|amd64) NAMES="Xray-linux-64.zip Xray-linux-amd64.zip" ;;
    aarch64|arm64) NAMES="Xray-linux-arm64-v8a.zip Xray-linux-arm64.zip" ;;
    *) NAMES="Xray-linux-64.zip" ;;
  esac
  got=""
  for n in $NAMES; do
    if dl "https://github.com/XTLS/Xray-core/releases/download/${VER}/${n}" "$DATA/x.zip"; then got="$n"; break; fi
  done
  [ -n "$got" ] || { echo "[boot] FATAL: xray download failed ($VER)"; exit 1; }
  if command -v unzip >/dev/null 2>&1; then
    unzip -oq "$DATA/x.zip" -d "$DATA/xbin"
  else
    apk add --no-cache unzip >/dev/null 2>&1 || true
    unzip -oq "$DATA/x.zip" -d "$DATA/xbin"
  fi
  install -m 0755 "$DATA/xbin/xray" "$XRAY"
  for g in geoip.dat geosite.dat; do
    [ -f "$DATA/xbin/$g" ] && cp "$DATA/xbin/$g" "$DATA/" || true
  done
  rm -rf "$DATA/x.zip" "$DATA/xbin"
  echo "[boot] installed xray $VER -> $XRAY"
fi
export XRAY_BIN="$XRAY"
export XRAY_LOCATIONS_ASSET="$DATA"

# --- 3) go ------------------------------------------------------------------
echo "[boot] starting supervisor"
exec env APP_DIR="$APP" STATE_DIR="$DATA" XRAY_BIN="$XRAY" XRAY_LOCATIONS_ASSET="$DATA" \
  sh "$APP/entrypoint.sh"
