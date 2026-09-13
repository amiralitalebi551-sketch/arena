#!/usr/bin/env bash
# ============================================================================
#  bootstrap-cmd.sh — prints EXACTLY what to type into ClawCloud App Launchpad.
#
#      bash scripts/bootstrap-cmd.sh                     # current branch
#      BOOT_REF=main bash scripts/bootstrap-cmd.sh       # after the PR is merged
#
#  FORM A (primary) needs NO shell script in the Command field at all: the
#  command is the single token `node`, and everything else lives in two
#  environment variables. No quoting, no spaces, no UI ambiguity.
# ============================================================================
set -eu
cd "$(dirname "$0")/.."
REPO="${BOOT_REPO:-amiralitalebi551-sketch/arena}"
REF="${BOOT_REF:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
URL_MJS="https://raw.githubusercontent.com/${REPO}/${REF}/scripts/bootstrap.mjs"
URL_SH="https://raw.githubusercontent.com/${REPO}/${REF}/scripts/bootstrap.sh"

# scripts/boot-loader.js is the readable source; strip comments, fold to one
# line, base64 it. Base64 (not percent-encoding) keeps the pasted value free of
# '%' and whitespace, which some web forms mangle.
LOADER="$(node -e '
const fs=require("fs");
let s=fs.readFileSync("scripts/boot-loader.js","utf8");
s=s.replace(/\/\*[\s\S]*?\*\//g," ");
s=s.split("\n").map(l=>l.trim()).filter(l=>l && !l.startsWith("//")).join(" ");
process.stdout.write(s.replace(/\s+/g," "));')"
B64="$(printf '%s' "$LOADER" | base64 | tr -d '\n')"
NODE_OPTIONS_VALUE="--import=data:text/javascript;base64,${B64}"

cat <<EOF
============================================================
 zero-CI deploy — ClawCloud Run / App Launchpad
 repo=${REPO}   ref=${REF}
============================================================

IMAGE NAME
    node:22-alpine

CONTAINER PORT          80      (+ switch "Public Access" ON)
LOCAL STORAGE           /data   (caches xray + keeps the IP history)
CPU / MEMORY            0.5 / 512M   (~\$3 of the \$5 monthly credit)

############################################################
# FORM A — PRIMARY. Tested end-to-end by scripts/test-bootstrap-mjs.sh
############################################################

COMMAND
    node
    (a single word. Leaving it empty also works — that IS the image's CMD.
     Verified against the real node:22-alpine docker-entrypoint.sh: it only
     prefixes "node" when \$1 starts with "-", is not a resolvable command, or
     is a non-executable file. "node" resolves, so nothing is rewritten.)

ARGS
    (leave empty)

ENVIRONMENT VARIABLES — exactly two:

  key: BOOT_URL
  value:
${URL_MJS}

  key: NODE_OPTIONS
  value:
${NODE_OPTIONS_VALUE}

loader: ${#LOADER} chars -> NODE_OPTIONS: ${#NODE_OPTIONS_VALUE} chars (base64, no spaces, no '%')

Why this form: node's official build carries its OWN CA root store, so HTTPS
works even though node:22-alpine ships no curl and no ca-certificates package.
Nothing is shell-quoted anywhere, so there is nothing for the UI to get wrong.

############################################################
# FORM B — if you cannot add env vars: Command + Args as list items
############################################################

  Command : sh
  Args    : -c
            wget -qO- ${URL_SH} | sh

  (with curl instead, if your image has it:  curl -fsSL ${URL_SH} | sh )
  bootstrap.sh installs ca-certificates/curl via apk if the first fetch fails.

############################################################
# FORM C — if there is only ONE Command box (it gets split on spaces)
############################################################

  sh -c wget\$IFS-qO-\$IFS${URL_SH}\$IFS|\$IFSsh

  \$IFS stands in for the spaces that the box would otherwise split on.

############################################################
# FORM D — plain shell, for a VPS / DevBox / anywhere with a terminal
############################################################

  wget -qO- ${URL_SH} | sh
  BOOT_REF=${REF} bash scripts/bootstrap-cmd.sh   # regenerate these strings

change target:  BOOT_REPO=owner/name BOOT_REF=main bash scripts/bootstrap-cmd.sh
EOF
