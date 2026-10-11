# Copyright Ayers Electronics Inc. All rights reserved.
#
# The commit-range floor, shared by the two commit-message gates (check-conventional, check-trailers)
# so the rule lives once. gates_since is the adoption commit: history before it predates the rules
# and is never judged, so a consumer's first run after adopting does not go red on commits nobody
# could have written to a rule that did not exist yet. EMPTY means no floor. A non-empty value must
# be an ancestor of head (a dead floor is an error). The floor only ever narrows the range: when base
# is already past it, base stands.
#
# Sourced, not executed, so it carries no `set` line - that would leak into the caller.

_gr_dir=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")
# shellcheck source=codestyle_key.sh
. "$_gr_dir/codestyle_key.sh"

range_base() {  # $1 = base, $2 = head; prints the effective base
  local since
  since=$(codestyle_key gates_since allow-empty) || return 1
  if [ -z "$since" ]; then printf '%s' "$1"; return; fi
  git merge-base --is-ancestor "$since" "$2" 2>/dev/null || { echo "gates_since '$since' is not an ancestor of $2 (dead floor)" >&2; return 1; }
  if git rev-parse --verify -q "$1^{commit}" >/dev/null 2>&1 && ! git merge-base --is-ancestor "$1" "$since" 2>/dev/null; then
    printf '%s' "$1"
  else
    printf '%s' "$since"
  fi
}

# Run directly with --self-test; sourced (the normal path) this block is skipped even when the
# sourcing gate was itself invoked with --self-test (a sourced file inherits the caller's args).
if [ "${BASH_SOURCE[0]}" = "$0" ] && [ "${1:-}" = "--self-test" ]; then
  set -euo pipefail
  d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
  fail() { echo "gates_range self-test FAILED: $*" >&2; exit 1; }
  g() { git -C "$d" "$@"; }
  g init -q; g config user.email t@t.t; g config user.name t
  for m in c0 c1 c2 c3; do g commit -q --allow-empty -m "$m"; done
  c0=$(g rev-parse HEAD~3); c1=$(g rev-parse HEAD~2); c2=$(g rev-parse HEAD~1); head=$(g rev-parse HEAD)
  rb() { ( cd "$d" && range_base "$1" "$2" ); }
  printf 'gates_since=\n' > "$d/.codestyle"
  [ "$(rb "$c0" "$head")" = "$c0" ] || fail "empty floor did not return the given base"
  printf 'gates_since=%s\n' "$c1" > "$d/.codestyle"
  [ "$(rb "$c0" "$head")" = "$c1" ] || fail "a base before the floor did not pull forward to the floor"
  [ "$(rb "$c2" "$head")" = "$c2" ] || fail "a base already past the floor did not stand"
  ( cd "$d" && git init -q other-orphan ) # unrelated commit for a dead-floor check
  orphan=$( cd "$d/other-orphan" && git config user.email t@t.t && git config user.name t && git commit -q --allow-empty -m x && git rev-parse HEAD )
  printf 'gates_since=%s\n' "$orphan" > "$d/.codestyle"
  rb "$c0" "$head" 2>/dev/null && fail "a floor that is not an ancestor of head was accepted"
  echo "gates_range self-test: empty floor keeps the base; a base before the floor pulls forward; a base past it stands; a non-ancestor floor is a dead-floor error"
  exit 0
fi
