#!/usr/bin/env bash
# Runs every test that does not need the public internet.
#   bash scripts/test-all.sh
set -uo pipefail
cd "$(dirname "$0")/.."
rc=0
echo "############ 1/4  config lint ############"
node scripts/lint-config.js || rc=1
echo
echo "############ 2/4  front.js ############"
node scripts/test-front.js || rc=1
echo
echo "############ 3/4  bootstrap chain (shell form) ############"
bash scripts/test-bootstrap.sh || rc=1
echo
echo "############ 4/4  bootstrap chain (FORM 3: NODE_OPTIONS, no Command) ############"
bash scripts/test-bootstrap-mjs.sh || rc=1
echo
if [ "$rc" = 0 ]; then echo "ALL TEST SUITES GREEN ✅"; else echo "SOMETHING FAILED ❌"; fi
exit "$rc"
