#!/usr/bin/env bash
# ============================================================================
#  make-link.sh — turn a hostname into ready-to-paste vless:// links + a
#  base64 subscription, using the fixed assets from the brief.
#
#  usage:  bash scripts/make-link.sh  myapp-xxxx.ap-xxx.clawcloudrun.com
#          bash scripts/make-link.sh  myapp-xxxx.ap-xxx.clawcloudrun.com --raw
# ============================================================================
set -eu
HOST="${1:-${PROXY_HOST:-}}"
MODE="${2:-}"

if [ -z "$HOST" ]; then
  echo "usage: bash scripts/make-link.sh <hostname> [--raw]" >&2
  echo "       (or: PROXY_HOST=<hostname> bash scripts/make-link.sh)" >&2
  exit 2
fi
HOST="${HOST#https://}"; HOST="${HOST#http://}"; HOST="${HOST%%/*}"; HOST="${HOST%%:*}"

UUID="${UUID:-bac2db35-df5b-47e1-a8e1-19ecd81c1ed5}"
WSPATH="${WSPATH:-/cf5d72f32b82}"
PORT="${PORT:-443}"
FP="${FP:-chrome}"
ALPN="${ALPN:-http/1.1}"
REMARK="${REMARK:-claw-vless}"
CLEAN_IPS=(${CLEAN_IPS:-104.17.147.22 162.159.36.1 172.67.74.1 104.18.0.1})

# percent-encode '/' and ':' the way v2rayNG / Hiddify / Streisand expect
enc(){ printf '%s' "$1" | sed -e 's#/#%2F#g' -e 's#:#%3A#g'; }
P_ENC="$(enc "$WSPATH")"; A_ENC="$(enc "$ALPN")"

mklink(){ # $1=address $2=remark
  printf 'vless://%s@%s:%s?encryption=none&security=tls&sni=%s&alpn=%s&fp=%s&type=ws&host=%s&path=%s#%s\n' \
    "$UUID" "$1" "$PORT" "$HOST" "$A_ENC" "$FP" "$HOST" "$P_ENC" "$(enc "$2")"
}

LINKS=()
LINKS+=("$(mklink "$HOST" "${REMARK}-direct")")
n=0
for ip in "${CLEAN_IPS[@]}"; do
  n=$((n+1))
  LINKS+=("$(mklink "$ip" "${REMARK}-cf${n}")")
done

if [ "$MODE" = "--raw" ]; then
  printf '%s\n' "${LINKS[@]}"
  exit 0
fi

echo "# ============================================================"
echo "# HOST      : $HOST"
echo "# PORT      : $PORT"
echo "# UUID      : $UUID"
echo "# WS PATH   : $WSPATH"
echo "# SNI/HOST  : $HOST"
echo "# FP / ALPN : $FP / $ALPN"
echo "# SECURITY  : tls (Cloudflare terminates it)"
echo "# ============================================================"
echo
echo "## 1) vless:// links (paste any one of these into v2rayNG / Streisand / Hiddify)"
echo
i=0
for l in "${LINKS[@]}"; do
  i=$((i+1)); echo "[$i] $l"; echo
done
echo "## 2) subscription (base64 of all of the above)"
echo
B64="$(printf '%s\n' "${LINKS[@]}" | base64 | tr -d '\n')"
echo "$B64"
echo
echo "## 3) subscription URL (served by the container itself, no CI needed)"
echo
echo "https://$HOST/__sub?t=${PANEL_TOKEN:-cf5d72f32b82}"
echo "https://$HOST/__panel?t=${PANEL_TOKEN:-cf5d72f32b82}    <- human readable page"
echo "https://$HOST/__ip?t=${PANEL_TOKEN:-cf5d72f32b82}       <- egress-IP proof JSON"
echo
echo "## 4) endpoint sanity (run me to check the tunnel is alive)"
echo
echo "bash scripts/check-endpoint.sh $HOST"
