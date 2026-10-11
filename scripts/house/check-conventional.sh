#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
#
# Conventional Commits, the shell half. The repos with node enforce the same rule with commitlint
# under codestyle/commitlint.config.mjs; the rest call this. One rule, two implementations: the
# repo that has both, assemblejs, runs every fixture through each and holds the two to one verdict
# (its check:commit-rule), against a byte-copy of this file at a named tag.
#
# The header (first line) must be `type(scope)!: subject`:
#   - type is one of the config-conventional set, lower-case
#   - scope is optional, in parentheses, and never empty
#   - an optional ! marks a breaking change
#   - the subject is non-empty, does not start with an upper-case letter, and has no trailing period
#   - the whole header is at most 100 characters and neither starts nor ends with whitespace
# Every line after the header is at most 100 characters, unless it holds a URL. A line that begins
# with # is a comment and is not read, nor is anything from git's scissors line on.
#
# A message git itself writes is not judged at all: a merge, a revert or a reapply in git's own
# quoted form, and an autosquash marker (fixup!, squash!, amend!). A revert written by hand takes
# the revert type like any other header.
#
# Usage: check-conventional.sh --message <file>   (hook)   or   check-conventional.sh <base> <head>   (CI)
#        check-conventional.sh --self-test
set -euo pipefail
TYPES='build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test'

GIT_OWN='^(Merge (branch(es)?|tags?|commits?|remote-tracking branch(es)?|pull request) .+|(Revert|Reapply) ".+"|(fixup|squash|amend)! .+)$'
SCISSORS='# ------------------------ >8 ------------------------'
MAX=100

# Returns 0 when the header is one git writes itself, which is never judged.
git_own() { grep -Eq "$GIT_OWN" <<<"$1"; }

# Returns 0 when the header conforms; prints the reason and returns 1 when it does not.
check_header() {
  local header="$1"
  if [ "${#header}" -gt "$MAX" ]; then
    echo "header is ${#header} chars, over the $MAX limit" >&2; return 1
  fi
  case "$header" in
    [[:space:]]*|*[[:space:]]) echo "header starts or ends with whitespace" >&2; return 1 ;;
  esac
  if ! grep -Eq "^($TYPES)(\([^)]*[^)[:space:]][^)]*\))?!?: .+" <<<"$header"; then
    echo "header is not 'type(scope): subject' with a known lower-case type ($TYPES) and no empty scope" >&2; return 1
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

# Returns 0 when the whole message in the file conforms; prints the reason and returns 1 when not.
check_message() {
  local file="$1" header line n=1
  header=$(head -n1 "$file")
  if git_own "$header"; then return 0; fi
  check_header "$header" || return 1
  while IFS= read -r line || [ -n "$line" ]; do
    n=$((n + 1))
    [ "$line" = "$SCISSORS" ] && break
    case "$line" in '#'*) continue ;; esac
    if [ "${#line}" -gt "$MAX" ] && ! grep -Eq 'https?://[^[:space:]]+' <<<"$line"; then
      echo "line $n is ${#line} chars, over the $MAX limit (only a line holding a URL may run longer)" >&2; return 1
    fi
  done < <(tail -n +2 "$file")
  return 0
}

# The commit-range floor helper, shared with check-trailers (it pulls in the .codestyle reader).
_kit_self=$(readlink -f "${BASH_SOURCE[0]}")
_kit_dir=$(dirname "$_kit_self")
# shellcheck source=gates_range.sh
. "$_kit_dir/gates_range.sh"

if [ "${1:-}" = "--self-test" ]; then
  self=${GATE_UNDER_TEST:-$_kit_self}
  m=$(mktemp); r=$(mktemp -d); trap 'rm -rf "$m" "$r"' EXIT
  hook() { printf '%b\n' "$1" > "$m"; bash "$self" --message "$m" >/dev/null 2>&1; }
  long=$(printf 'x%.0s' {1..101})
  ok_msgs=(
    "feat: add the pack consent step" "fix(console): repoint the drift pin" "refactor!: drop the legacy reader" "docs: note the pin"
    'Revert "fix: switch profile matches back'"'"'s letter spacing"' 'Reapply "fix: the thing"'
    "Merge branch 'main' into next" "Merge tag 'v1.0.0'" "Merge remote-tracking branch 'origin/main'" "Merge pull request #7 from a/b"
    "fixup! feat: add the thing" "squash! feat: add the thing" "amend! feat: add the thing"
    "feat: add the thing\n\nA body line.\n\nRefs: #7"
    "feat: add the thing\n\nSee https://example.test/$long for the whole of it."
    "feat: add the thing\n\n# $long\nA body line."
    "feat: add the thing\n\nA body line.\n$SCISSORS\ndiff --git $long"
    "Merge branch 'side'\n\n$long"
  )
  bad_msgs=(
    "Added the thing" "feat: Add the thing" "feat: add a thing." "wip: something" "feat add the thing" "Reverted the thing"
    'Revert fix: the thing' "1.0.0" "feat(): add the thing" "feat( ): add the thing" "feat: add the thing " " feat: add the thing"
    "Merged in the side branch" "feat: $long"
    "feat: add the thing\n\n$long"
    "feat: add the thing\n\nA body line.\n\nRefs: $long"
  )
  for msg in "${ok_msgs[@]}"; do
    hook "$msg" || { echo "conventional self-test FAILED: refused a valid message: $msg" >&2; exit 1; }
  done
  for msg in "${bad_msgs[@]}"; do
    if hook "$msg"; then echo "conventional self-test FAILED: accepted a bad message: $msg" >&2; exit 1; fi
  done

  # The gates_since floor, driven through the real CI mode on real history: c0 good, c1 a
  # pre-adoption commit that breaks the rule, c2 and c3 good after adoption.
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
  ( cd "$r" && git commit -q --allow-empty -m "feat: a long body" -m "$long" )
  if ci "$c5" "$(cd "$r" && git rev-parse HEAD)" >/dev/null; then echo "conventional self-test FAILED: a body line over the limit passed in a range" >&2; exit 1; fi
  ( cd "$r" && git reset -q --hard "$c5" )
  printf 'gates_since=0000000000000000000000000000000000000001\n' > "$r/.codestyle"
  if out=$(ci "$c0" "$c3"); then echo "conventional self-test FAILED: accepted a dead floor" >&2; exit 1; fi
  grep -q "dead floor" <<<"$out" || { echo "conventional self-test FAILED: dead floor not named; got: $out" >&2; exit 1; }
  : > "$r/.codestyle"
  if ci "$c0" "$c3" >/dev/null 2>&1; then echo "conventional self-test FAILED: passed with no gates_since key" >&2; exit 1; fi
  echo "conventional self-test: accepted ${#ok_msgs[@]} valid messages and refused ${#bad_msgs[@]} bad ones, in the hook's own mode; a range judges each commit's body too; the gates_since floor exempts pre-adoption history, never widens, and a dead or missing floor fails closed"
  exit 0
fi

if [ "${1:-}" = "--message" ]; then
  check_message "$2" || { echo "  in: $(head -n1 "$2")" >&2; exit 1; }
  exit 0
fi

base="${1:?usage: check-conventional.sh <base> <head> | --message <file> | --self-test}"; head="$2"; fail=0
base=$(range_base "$base" "$head") || exit 1
message=$(mktemp); trap 'rm -f "$message"' EXIT
for sha in $(git rev-list --no-merges "$base".."$head"); do
  git log -1 --format=%B "$sha" > "$message"
  check_message "$message" || { echo "  $sha: $(head -n1 "$message")" >&2; fail=1; }
done
[ "$fail" -eq 0 ] && echo "conventional commits: clean"
exit "$fail"
