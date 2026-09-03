#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
# Stop: a session does not end on a red typecheck or test. Exit 2 refuses the stop.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"
log="${TMPDIR:-/tmp}/assemblejs-stop-check.log"
if ! pnpm typecheck >"$log" 2>&1; then
  echo "BLOCKED: typecheck is red. Fix it before ending the session." >&2; tail -n 40 "$log" >&2; exit 2
fi
if ! pnpm test >"$log" 2>&1; then
  echo "BLOCKED: tests are red. Fix them before ending the session." >&2; tail -n 40 "$log" >&2; exit 2
fi
exit 0
