#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
#
# Conventional Commits, the shell half. The node repos enforce this with commitlint's
# config-conventional; the four non-node repos call this. The two must agree on the same fixtures -
# that parity is a separate cross-test.
#
# The header (first line) must be `type(scope)!: subject`:
#   - type is one of the config-conventional set, lower-case
#   - scope is optional, in parentheses
#   - an optional ! marks a breaking change
#   - the subject is non-empty, does not start with an upper-case letter, and has no trailing period
#   - the whole header is at most 100 characters (commitlint header-max-length)
#
# Usage: check-conventional.sh --message <file>   (hook)   or   check-conventional.sh <base> <head>   (CI)
#        check-conventional.sh --self-test
set -euo pipefail
TYPES='build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test'

# Returns 0 when the header conforms; prints the reason and returns 1 when it does not.
check_header() {
  local header="$1"
  if [ "${#header}" -gt 100 ]; then
    echo "header is ${#header} chars, over the 100 limit" >&2; return 1
  fi
  # git's own revert header, Revert "<subject>", is the revert type as git writes it.
  if grep -Eq '^Revert ".+"$' <<<"$header"; then
    return 0
  fi
  if ! grep -Eq "^($TYPES)(\([^)]+\))?!?: .+" <<<"$header"; then
    echo "header is not 'type(scope): subject' with a known lower-case type ($TYPES)" >&2; return 1
  fi
  local subject="${header#*: }"
  case "$subject" in
    [A-Z]*) echo "subject starts with an upper-case letter" >&2; return 1 ;;
  esac
  case "$subject" in
    *.) echo "subject ends with a period" >&2; return 1 ;;
  esac
  return 0
}

# The commit-range floor helper, shared with check-trailers (it pulls in the .codestyle reader).
_kit_self=$(readlink -f "${BASH_SOURCE[0]}")
_kit_dir=$(dirname "$_kit_self")
# shellcheck source=gates_range.sh
. "$_kit_dir/gates_range.sh"

if [ "${1:-}" = "--self-test" ]; then
  ok_msgs=("feat: add the pack consent step" "fix(console): repoint the drift pin" "refactor!: drop the legacy reader" "docs: note the pin" 'Revert "fix: switch profile matches back'"'"'s letter spacing"')
  bad_msgs=("Added the thing" "feat: Add the thing" "feat: add a thing." "wip: something" "feat add the thing" "Reverted the thing" 'Revert fix: the thing')
  for m in "${ok_msgs[@]}"; do
    check_header "$m" >/dev/null || { echo "conventional self-test FAILED: refused a valid header: $m" >&2; exit 1; }
  done
  for m in "${bad_msgs[@]}"; do
    if check_header "$m" 2>/dev/null; then echo "conventional self-test FAILED: accepted a bad header: $m" >&2; exit 1; fi
  done
  long="feat: $(printf 'x%.0s' {1..120})"
  if check_header "$long" 2>/dev/null; then echo "conventional self-test FAILED: accepted a >100 header" >&2; exit 1; fi

  # The gates_since floor, driven through the real CI mode on real history: c0 good, c1 a
  # pre-adoption commit that breaks the rule, c2 and c3 good after adoption.
  self=${GATE_UNDER_TEST:-$_kit_self}
  r=$(mktemp -d); trap 'rm -rf "$r"' EXIT
  ( cd "$r" && git init -q && git config user.email t@t.t && git config user.name t \
    && git commit -q --allow-empty -m "feat: c0" && git commit -q --allow-empty -m "wip stuff" \
    && git commit -q --allow-empty -m "feat: c2" && git commit -q --allow-empty -m "feat: c3" )
  c0=$(cd "$r" && git rev-parse HEAD~3); c1=$(cd "$r" && git rev-parse HEAD~2); c2=$(cd "$r" && git rev-parse HEAD~1); c3=$(cd "$r" && git rev-parse HEAD)
  ci() { ( cd "$r" && bash "$self" "$@" 2>&1 ); }
  printf 'gates_since=\n' > "$r/.codestyle"
  if ci "$c0" "$c3" >/dev/null; then echo "conventional self-test FAILED: with no floor, the pre-adoption commit passed" >&2; exit 1; fi
  printf 'gates_since=%s\n' "$c1" > "$r/.codestyle"
  ci "$c0" "$c3" >/dev/null || { echo "conventional self-test FAILED: the floor did not exempt the pre-adoption commit" >&2; exit 1; }
  ci "$c2" "$c3" >/dev/null || { echo "conventional self-test FAILED: a base past the floor was widened back to it" >&2; exit 1; }
  ( cd "$r" && git checkout -q -b side && git commit -q --allow-empty -m "feat: on a branch" && git checkout -q - && git merge -q --no-ff -m "Merge branch 'side'" side )
  c5=$(cd "$r" && git rev-parse HEAD)
  ci "$c2" "$c5" >/dev/null || { echo "conventional self-test FAILED: a merge commit's own subject was judged" >&2; exit 1; }
  printf 'gates_since=0000000000000000000000000000000000000001\n' > "$r/.codestyle"
  if out=$(ci "$c0" "$c3"); then echo "conventional self-test FAILED: accepted a dead floor" >&2; exit 1; fi
  grep -q "dead floor" <<<"$out" || { echo "conventional self-test FAILED: dead floor not named; got: $out" >&2; exit 1; }
  : > "$r/.codestyle"
  if ci "$c0" "$c3" >/dev/null 2>&1; then echo "conventional self-test FAILED: passed with no gates_since key" >&2; exit 1; fi
  echo "conventional self-test: accepted ${#ok_msgs[@]} valid headers, refused ${#bad_msgs[@]} bad ones and an over-length header; the gates_since floor exempts pre-adoption history, never widens, and a dead or missing floor fails closed"
  exit 0
fi

if [ "${1:-}" = "--message" ]; then
  header=$(head -n1 "$2")
  check_header "$header" || { echo "  in: $header" >&2; exit 1; }
  exit 0
fi

base="${1:?usage: check-conventional.sh <base> <head> | --message <file> | --self-test}"; head="$2"; fail=0
base=$(range_base "$base" "$head") || exit 1
for sha in $(git rev-list --no-merges "$base".."$head"); do
  header=$(git log -1 --format=%s "$sha")
  check_header "$header" || { echo "  $sha: $header" >&2; fail=1; }
done
[ "$fail" -eq 0 ] && echo "conventional commits: clean"
exit "$fail"
