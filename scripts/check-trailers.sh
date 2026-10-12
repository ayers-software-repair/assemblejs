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
# Usage: check-trailers.sh <base> <head>      every commit in base..head (CI names both)
#        check-trailers.sh                    the commits this branch has and its upstream lacks
#        check-trailers.sh --message <file>   one message (the commit-msg hook)
set -euo pipefail
# Read whatever its case, since a trailer's key is: `co-authored-by:` is the trailer
# `Co-Authored-By:` is. And the line a coding agent appends by default is no trailer at all, a
# sentence with a mark before it and no colon after, so it is named by what it says.
FORBIDDEN='^(co-authored-by|claude-session|assisted-by|generated-by)[[:space:]]*:|generated with \[?claude'
SIGNOFF='^Signed-off-by: .+ <.+@.+>$'

if [ "${1:-}" = "--self-test" ]; then
  tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT
  printf 'feat: a change\n\nbody\n' > "$tmp"
  if bash "$0" --message "$tmp" 2>/dev/null; then
    echo "trailer gate self-test FAILED: it accepted a message with no Signed-off-by" >&2; exit 1
  fi
  printf 'feat: a change\n\nbody\n\nSigned-off-by: A Person <a@example.com>\n' > "$tmp"
  bash "$0" --message "$tmp" >/dev/null || { echo "trailer gate self-test FAILED: it refused a signed message" >&2; exit 1; }

  # The range form, in a repository made for this run: a signed range is clean, and one commit
  # with no sign-off, or with an attribution trailer beside its sign-off, turns the range red.
  self=$(cd "$(dirname "$0")" && pwd)/$(basename "$0")
  repo=$(mktemp -d); trap 'rm -f "$tmp"; rm -rf "$repo"' EXIT
  git -C "$repo" init -q
  commit() {
    git -C "$repo" -c user.name=tester -c user.email=tester@example.com -c commit.gpgsign=false \
      commit -q --allow-empty --no-verify -m "$1"
    git -C "$repo" rev-parse HEAD
  }
  signed=$'\n\nSigned-off-by: A Person <a@example.com>'
  first=$(commit "feat: one$signed")
  second=$(commit "feat: two$signed")
  (cd "$repo" && bash "$self" "$first" "$second" >/dev/null) \
    || { echo "trailer gate self-test FAILED: it refused a signed range" >&2; exit 1; }
  unsigned=$(commit "feat: three")
  if (cd "$repo" && bash "$self" "$second" "$unsigned" >/dev/null 2>&1); then
    echo "trailer gate self-test FAILED: it accepted a commit with no Signed-off-by" >&2; exit 1
  fi
  attributed=$(commit "feat: four"$'\n\nCo-Authored-By: A Tool <tool@example.com>'"${signed#$'\n'}")
  if (cd "$repo" && bash "$self" "$unsigned" "$attributed" >/dev/null 2>&1); then
    echo "trailer gate self-test FAILED: it accepted an attribution trailer" >&2; exit 1
  fi
  # A key in another case is the same trailer, and the line an agent appends by default, a mark
  # and a sentence with no colon, is an attribution all the same. Each was let through.
  for attribution in 'co-authored-by: A Tool <tool@example.com>' 'CO-AUTHORED-BY: A Tool <tool@example.com>' \
    $'\U0001F916 Generated with [Claude Code](https://claude.com/claude-code)' 'Generated with Claude Code'; do
    printf 'feat: a change\n\nbody\n\n%s\nSigned-off-by: A Person <a@example.com>\n' "$attribution" > "$tmp"
    if bash "$0" --message "$tmp" >/dev/null 2>&1; then
      echo "trailer gate self-test FAILED: it accepted the attribution \"$attribution\"" >&2; exit 1
    fi
  done
  # A body that says how something was generated is no attribution.
  printf 'feat: a change\n\nThe reference is generated with the compiler, and co-authored-by is a word here.\n\nSigned-off-by: A Person <a@example.com>\n' > "$tmp"
  bash "$0" --message "$tmp" >/dev/null || { echo "trailer gate self-test FAILED: it refused a body that is no attribution" >&2; exit 1; }
  # With no range and no upstream there is nothing to compare with, and it says so.
  if (cd "$repo" && bash "$self" >/dev/null 2>&1); then
    echo "trailer gate self-test FAILED: it passed with no range and no upstream" >&2; exit 1
  fi
  echo "trailer gate self-test: red on a missing sign-off and on an attribution, a trailer in any case and an agent's default line, in a message and in a range; green on signed ones, as required"
  exit 0
fi

if [ "${1:-}" = "--message" ]; then
  # Held to both rules where it is written, as a range is: the hook that reads one message let an
  # attribution through for CI to find after the push.
  if grep -Eiq "$FORBIDDEN" "$2"; then
    echo "commit message carries an attribution, which no commit here does: remove the line" >&2; exit 1
  fi
  if ! grep -Eq "$SIGNOFF" "$2"; then
    echo "commit message lacks a Signed-off-by trailer (use git commit -s)" >&2; exit 1
  fi
  exit 0
fi

# No range named: the commits this branch has and its upstream lacks, which is what a push sends.
base="${1:-}"; head="${2:-HEAD}"; fail=0
if [ -z "$base" ]; then
  base=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null) || {
    echo "check-trailers: no range was given and this branch has no upstream: check-trailers.sh <base> <head>" >&2
    exit 2
  }
fi
for sha in $(git rev-list "$base".."$head"); do
  body=$(git log -1 --format=%B "$sha")
  if printf '%s\n' "$body" | grep -Eiq "$FORBIDDEN"; then
    echo "$sha: forbidden attribution trailer" >&2; fail=1
  fi
  if ! printf '%s\n' "$body" | grep -Eq "$SIGNOFF"; then
    echo "$sha: no Signed-off-by" >&2; fail=1
  fi
done
[ "$fail" -eq 0 ] && echo "commit trailers: clean"
exit "$fail"
