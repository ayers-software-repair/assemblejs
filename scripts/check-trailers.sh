#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# Two jobs, and they answer to different things.
#
# DCO: every commit carries Signed-off-by, per CONTRIBUTING. Nothing else enforces it, so it
# runs both locally and in CI.
#
# ATTRIBUTION: no Claude or AI trailer, ever. Locally this is now handled at the source: the
# `attribution` keys in settings mean the trailer is never written, so the commit-msg hook no
# longer greps for it. That setting is per machine, so it says nothing about a fork pull request
# from a contributor running default settings, whose commits do carry one. CI still greps.
#
# Usage: check-trailers.sh <base> <head>   (CI)   or   check-trailers.sh --message <file>   (hook)
set -euo pipefail
FORBIDDEN='^(Co-Authored-By|Co-authored-by|Generated with|Claude-Session|Assisted-by|Generated-by):'
SIGNOFF='^Signed-off-by: .+ <.+@.+>$'

if [ "${1:-}" = "--self-test" ]; then
  tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT
  printf 'feat: a change\n\nbody\n' > "$tmp"
  if bash "$0" --message "$tmp" 2>/dev/null; then
    echo "trailer gate self-test FAILED: it accepted a message with no Signed-off-by" >&2; exit 1
  fi
  printf 'feat: a change\n\nbody\n\nSigned-off-by: A Person <a@example.com>\n' > "$tmp"
  bash "$0" --message "$tmp" >/dev/null || { echo "trailer gate self-test FAILED: it refused a signed message" >&2; exit 1; }
  echo "trailer gate self-test: red on a missing sign-off, green on a signed message, as required"
  exit 0
fi

if [ "${1:-}" = "--message" ]; then
  if ! grep -Eq "$SIGNOFF" "$2"; then
    echo "commit message lacks a Signed-off-by trailer (use git commit -s)" >&2; exit 1
  fi
  exit 0
fi

base="$1"; head="$2"; fail=0
for sha in $(git rev-list "$base".."$head"); do
  body=$(git log -1 --format=%B "$sha")
  if printf '%s\n' "$body" | grep -Eq "$FORBIDDEN"; then
    echo "$sha: forbidden attribution trailer" >&2; fail=1
  fi
  if ! printf '%s\n' "$body" | grep -Eq "$SIGNOFF"; then
    echo "$sha: no Signed-off-by" >&2; fail=1
  fi
done
[ "$fail" -eq 0 ] && echo "commit trailers: clean"
exit "$fail"
