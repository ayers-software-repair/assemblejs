#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
# Every commit in the range carries Signed-off-by and no other attribution trailer.
# Usage: check-trailers.sh <base> <head>   (CI)   or   check-trailers.sh --message <file>   (commit-msg hook)
set -euo pipefail
FORBIDDEN='^(Co-Authored-By|Co-authored-by|Generated with|Claude-Session|Assisted-by|Generated-by):'
if [ "${1:-}" = "--message" ]; then
  msg=$(cat "$2")
  if printf '%s\n' "$msg" | grep -Eq "$FORBIDDEN"; then
    echo "commit message carries a forbidden attribution trailer" >&2; exit 1
  fi
  if ! printf '%s\n' "$msg" | grep -Eq '^Signed-off-by: .+ <.+@.+>$'; then
    echo "commit message lacks a Signed-off-by trailer (use git commit -s)" >&2; exit 1
  fi
  exit 0
fi
base="$1"; head="$2"; fail=0
for sha in $(git rev-list "$base".."$head"); do
  body=$(git log -1 --format=%B "$sha")
  if printf '%s\n' "$body" | grep -Eq "$FORBIDDEN"; then echo "$sha: forbidden attribution trailer" >&2; fail=1; fi
  if ! printf '%s\n' "$body" | grep -Eq '^Signed-off-by: .+ <.+@.+>$'; then echo "$sha: no Signed-off-by" >&2; fail=1; fi
done
[ "$fail" -eq 0 ] && echo "commit trailers: clean"
exit "$fail"
