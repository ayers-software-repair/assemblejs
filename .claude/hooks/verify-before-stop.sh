#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
# Stop: a session does not end on a red tree. Exit 2 refuses the stop.
#
# This runs the fast gates only: the structural ones cost about two seconds and typecheck and
# test about fifteen. Build, pack and the published-surface checks belong to `pnpm check` and to
# CI, because a gate slow enough to resent is a gate someone turns off.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"
log="${TMPDIR:-/tmp}/assemblejs-stop-check.log"

run() {
  local label="$1"; shift
  if ! "$@" >"$log" 2>&1; then
    echo "BLOCKED: ${label} is red. Fix it before ending the session." >&2
    tail -n 40 "$log" >&2
    exit 2
  fi
}

run "the identity gate"     bash scripts/identity-gate.sh
run "the emoji gate"        node scripts/check-emoji.mjs
run "the header check"      node scripts/check-headers.mjs
run "the organization gate" node scripts/check-organization.mjs
run "the mirror gate"       node scripts/check-mirror.mjs
run "lint"                  pnpm lint
run "typecheck"             pnpm typecheck
run "the tests"             pnpm test
exit 0
