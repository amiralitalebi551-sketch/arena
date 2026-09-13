#!/usr/bin/env bash
# ============================================================================
#  check-endpoint.sh — is the VLESS endpoint actually alive?
#
#  Healthy endpoint:  GET /            -> 404
#                     broken WS        -> 400
#                     real WS handshake-> 101 Switching Protocols
#                     530 / 000        -> tunnel dead (ingress has no backend)
#
#  usage: bash scripts/check-endpoint.sh <hostname> [ws-path]
#  It also re-runs the handshake through each clean Cloudflare IP with --resolve,
#  which is EXACTLY what your client does (address=IP, SNI/Host=hostname).
# ============================================================================
set -u
HOST="${1:-${PROXY_HOST:-}}"
P="${2:-${WSPATH:-/cf5d72f32b82}}"
CLEAN_IPS=(${CLEAN_IPS:-104.17.147.22 162.159.36.1 172.67.74.1 104.18.0.1})
[ -z "$HOST" ] && { echo "usage: bash scripts/check-endpoint.sh <hostname> [ws-path]"; exit 2; }

WSKEY="$(head -c16 /dev/urandom | base64)"
code(){ curl -s -o /dev/null -w '%{http_code}' --max-time "${TO:-15}" "$@" 2>/dev/null; }
hs(){ # websocket handshake -> prints http code (101 = success). A real 101 keeps the
      # socket open, so curl exits 28; we read the status line instead of -w.
  local out c
  out=$(curl -s -i --max-time "${TO:-8}" --http1.1 \
        -H 'Upgrade: websocket' -H 'Connection: Upgrade' \
        -H "Sec-WebSocket-Key: $WSKEY" -H 'Sec-WebSocket-Version: 13' "$@" 2>/dev/null | head -n1)
  c=$(printf '%s' "$out" | awk '{print $2}')
  case "$c" in ''|*[!0-9]*) c=000;; esac
  printf '%s' "$c"
}
verdict(){ # $1=label $2=got $3=want
  if [ "$2" = "$3" ]; then printf '  %-46s %-5s  PASS ✅\n' "$1" "$2"; else printf '  %-46s %-5s  want %s ❌\n' "$1" "$2" "$3"; fi
}

echo "=== endpoint sanity: https://$HOST  path=$P  ($(date -u +%FT%TZ)) ==="
echo "-- direct (hostname as address)"
verdict "GET /"                         "$(code "https://$HOST/")"                  404
verdict "GET $P (no upgrade headers)"    "$(code "https://$HOST$P")"                400
verdict "GET $P (real WS handshake)"     "$(hs   "https://$HOST$P")"                101
verdict "GET /__health"                 "$(code "https://$HOST/__health")"          200

echo "-- through clean Cloudflare IPs (--resolve => SNI/Host stay $HOST)"
for ip in "${CLEAN_IPS[@]}"; do
  r="--resolve $HOST:443:$ip"
  printf '  %-16s / %-4s handshake %-4s health %s\n' "$ip" \
    "$(code $r "https://$HOST/")" "$(hs $r "https://$HOST$P")" "$(code $r "https://$HOST/__health")"
done

echo
echo "reading:  404 + 400 + 101 = alive.  530/521/502 = ingress up, container dead."
echo "          000 = DNS/TLS/blocked.  handshake 404 = wrong WS path."
