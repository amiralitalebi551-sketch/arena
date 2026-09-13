#!/usr/bin/env bash
# ============================================================================
#  THE VERIFICATION PROTOCOL (§5 of the brief) — no self-reported success.
#  Run this against a live Xray client whose SOCKS inbound is on $SOCKS.
#
#  SOCKS=127.0.0.1:10808 bash scripts/verify.sh
# ============================================================================
set -u
SOCKS="${SOCKS:-127.0.0.1:10808}"
ROUNDS="${ROUNDS:-10}"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-1}"      # seconds between IP samples
SITES="${SITES:-youtube.com instagram.com x.com telegram.org chat.openai.com discord.com}"
DL_URL="${DL_URL:-https://speed.cloudflare.com/__down?bytes=10000000}"
C="curl -s --socks5-hostname $SOCKS"
pass=0; fail=0
hr(){ printf -- '----------------------------------------------------------------\n'; }
say(){ printf '\n### %s\n' "$1"; hr; }

echo "verify.sh  socks=$SOCKS  rounds=$ROUNDS  $(date -u +%FT%TZ)"

# ------------------------------------------------------------------ 1) up?
say "1) CONNECTIVITY  (expect $ROUNDS/$ROUNDS x 204)"
codes=""
for i in $(seq 1 "$ROUNDS"); do
  c=$($C -o /dev/null -w '%{http_code}' --max-time 20 https://www.google.com/generate_204)
  codes="$codes$c "
  [ "$c" = "204" ] && pass=$((pass+1)) || fail=$((fail+1))
  sleep "$SLEEP_BETWEEN"
done
echo "codes: $codes"
ok204=$(printf '%s' "$codes" | tr ' ' '\n' | grep -c '^204$' || true)
echo "RESULT: $ok204/$ROUNDS"
[ "$ok204" = "$ROUNDS" ] && echo "VERDICT-1: PASS ✅" || echo "VERDICT-1: FAIL ❌"

# ------------------------------------------------------- 2) static IP (now)
say "2) EGRESS IP  (all samples must be identical)"
ips=""
for i in $(seq 1 "$ROUNDS"); do
  ip=$($C --max-time 15 https://api.ipify.org 2>/dev/null || echo TIMEOUT)
  [ -z "$ip" ] && ip=EMPTY
  ips="$ips$ip "
  echo "  [$i] $ip"
  sleep "$SLEEP_BETWEEN"
done
uniq_count=$(printf '%s' "$ips" | tr ' ' '\n' | sed '/^$/d' | sort -u | wc -l | tr -d ' ')
first_ip=$(printf '%s' "$ips" | tr ' ' '\n' | sed '/^$/d' | sort -u | head -1)
echo "distinct IPs: $uniq_count -> $ips"
if [ "$uniq_count" = "1" ]; then echo "VERDICT-2: PASS ✅  egress IP = $first_ip"; else echo "VERDICT-2: FAIL ❌  egress IP is ROTATING"; fi

# ------------------------------------------------- 3) static IP over TIME
say "3) EGRESS IP OVER TIME  (set WAIT_MIN>0 to include a long window)"
WAIT_MIN="${WAIT_MIN:-0}"
if [ "$WAIT_MIN" -gt 0 ] 2>/dev/null; then
  echo "sleeping ${WAIT_MIN}m then re-sampling (restart the container during this window)"
  sleep $((WAIT_MIN * 60))
  ip2=$($C --max-time 15 https://api.ipify.org 2>/dev/null || echo TIMEOUT)
  echo "  after wait: $ip2  (was: $first_ip)"
  [ "$ip2" = "$first_ip" ] && echo "VERDICT-3: PASS ✅" || echo "VERDICT-3: FAIL ❌ CHANGED after restart/time"
else
  echo "skipped (WAIT_MIN=0)"
fi

# ------------------------------------------------------ 4) censored sites
say "4) BLOCKED SITES  (expect 2xx/3xx/403 — anything but 000)"
site_fail=0
for s in $SITES; do
  code=$($C -o /dev/null -w '%{http_code}' --max-time 25 "https://$s" 2>/dev/null)
  [ -z "$code" ] && code=000
  printf '  %-22s %s\n' "$s" "$code"
  [ "$code" = "000" ] && site_fail=$((site_fail+1))
done
[ "$site_fail" = "0" ] && echo "VERDICT-4: PASS ✅" || echo "VERDICT-4: FAIL ❌ ($site_fail dead)"

# ----------------------------------------------------------- 5) throughput
say "5) THROUGHPUT  (10 MB from speed.cloudflare.com)"
spd=$($C -o /dev/null -w '%{speed_download}' --max-time 45 "$DL_URL" 2>/dev/null || echo 0)
mbps=$(awk -v s="$spd" 'BEGIN{printf "%.2f", s*8/1000000}')
echo "  ${spd} B/s  =  ${mbps} Mbit/s"
awk -v s="$spd" 'BEGIN{exit !(s>100000)}' && echo "VERDICT-5: PASS ✅" || echo "VERDICT-5: WEAK ⚠️"

# --------------------------------------------------------------- 6) extras
say "6) EXTRAS"
echo -n "  ipv6 egress: "; $C --max-time 12 https://api64.ipify.org 2>/dev/null || echo "none/err"; echo
echo -n "  asn/org:     "; $C --max-time 12 "https://ipinfo.io/${first_ip}/org" 2>/dev/null || echo "n/a"; echo
echo -n "  country:     "; $C --max-time 12 "https://ipinfo.io/${first_ip}/country" 2>/dev/null || echo "n/a"; echo

say "SUMMARY"
echo "  connectivity   : $ok204/$ROUNDS"
echo "  egress IP      : $first_ip   (distinct=$uniq_count)"
if [ "$uniq_count" = "1" ] && [ "$ok204" = "$ROUNDS" ] && [ "$site_fail" = "0" ]; then
  echo "  OVERALL        : PASS ✅"
else
  echo "  OVERALL        : FAIL ❌"
fi
echo "  throughput     : ${mbps} Mbit/s"
