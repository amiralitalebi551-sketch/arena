#!/usr/bin/env bash
# Runs every test that does not need the public internet.
#   bash scripts/test-all.sh
set -uo pipefail
cd "$(dirname "$0")/.."
rc=0
echo "############ 1/3  config lint ############"
node scripts/lint-config.js || rc=1
echo
echo "############ 2/3  front.js ############"
node scripts/test-front.js || rc=1
echo
echo "############ 3/3  bootstrap chain ############"
bash scripts/test-bootstrap.sh || rc=1
echo
if [ "$rc" = 0 ]; then echo "ALL TEST SUITES GREEN ✅"; else echo "SOMETHING FAILED ❌"; fi
exit "$rc"
