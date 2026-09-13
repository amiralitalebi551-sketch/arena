#!/usr/bin/env bash
# ============================================================================
#  bootstrap-cmd.sh — prints the exact strings to paste into ClawCloud Run
#  App Launchpad for the zero-CI deploy path.
#
#      bash scripts/bootstrap-cmd.sh              # all forms
#      BOOT_REF=main bash scripts/bootstrap-cmd.sh
#
#  NOTE: node:22-alpine has busybox wget but NOT curl, so wget is the default.
# ============================================================================
set -eu
REPO="${BOOT_REPO:-amiralitalebi551-sketch/arena}"
REF="${BOOT_REF:-$(git -C "$(dirname "$0")/.." rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
URL="https://raw.githubusercontent.com/${REPO}/${REF}/scripts/bootstrap.sh"

cat <<EOF
============================================================
 zero-CI deploy — paste these into ClawCloud App Launchpad
============================================================

IMAGE NAME
  node:22-alpine

ENVIRONMENT VARIABLES (optional; defaults are already your assets)
  PANEL_TOKEN   cf5d72f32b82        <- CHANGE THIS, it unlocks /__panel
  BOOT_REF      ${REF}

CONTAINER PORT
  80            (and switch "Public Access" ON)

LOCAL STORAGE
  /data         (mount it: caches xray + keeps the IP history across restarts)

------------------------------------------------------------
FORM 1 — if Command and Args are SEPARATE fields (most likely)
------------------------------------------------------------
  Command  (启动命令), one item:      sh
  Args     (命令参数), two items:     -c
                                      wget -qO- ${URL} | sh

------------------------------------------------------------
FORM 2 — if there is a SINGLE "Command" text box
         (it is split on spaces into the k8s command array, so
          literal spaces cannot survive; \$IFS stands in for them)
------------------------------------------------------------
  sh -c wget\$IFS-qO-\$IFS${URL}\$IFS|\$IFSsh

------------------------------------------------------------
FORM 3 — what actually runs, in plain words (for a shell/VPS/DevBox)
------------------------------------------------------------
  sh -c "wget -qO- ${URL} | sh"
  # or with curl if your image has it:
  sh -c "curl -fsSL ${URL} | sh"

repo/ref baked in: ${REPO} @ ${REF}
change it:  BOOT_REPO=owner/name BOOT_REF=main bash scripts/bootstrap-cmd.sh
EOF
