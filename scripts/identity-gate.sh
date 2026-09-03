#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# The identity gate. Two rules, both hard:
#   1. No forbidden identity string anywhere in the tree (the legacy package name, the legacy
#      handle, the retired brand, any iCloud address).
#   2. The publisher law: "Ayers Software Repair" appears on no package-metadata surface
#      (any package.json). Publisher is Ayers Electronics; copyright is Ayers Electronics Inc.
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='zjayers|MeridianVega|asmbl|icloud'
PUBLISHER='Ayers Software Repair'

# THE GATE SCANS WHAT GIT TRACKS, not the working tree.
# Only a tracked file can be committed, published, or shipped in a tarball; an ignored or
# untracked file is none of those. `git ls-files` covers tracked AND staged, so a new file
# reaches the gate at the moment it could first enter history, which is where it matters.
tracked() {
  git ls-files -c -- . \
    | grep -vE '^(scripts/identity-gate\.sh|scripts/fixtures/|pnpm-lock\.yaml|docs/dossiers/)'
}

# BOTH RULES, over whatever file list is piped in. This is the whole gate, and it is the same
# code the self-test exercises: a self-test that re-implements the rules proves only that the
# re-implementation works, which is what the earlier one did.
#
# An empty list is a failure, not a pass. A file list that selects nothing is indistinguishable
# from a clean tree by its output alone, and that is exactly how a broken filter reports safety.
scan() {
  local files fail=0
  files=$(cat)
  if [ -z "$files" ]; then
    echo "identity gate: the file list is empty, which is a broken scan and not a clean tree" >&2
    return 1
  fi
  if printf '%s\n' "$files" | xargs -r grep -EIn "$PATTERN"; then
    echo "identity gate: forbidden identity string found (matches above)" >&2
    fail=1
  fi
  while IFS= read -r manifest; do
    [ -n "$manifest" ] || continue
    if grep -n "$PUBLISHER" "$manifest"; then
      echo "identity gate: publisher law violated in $manifest" >&2
      fail=1
    fi
  done < <(printf '%s\n' "$files" | grep -E '(^|/)package\.json$' || true)
  return "$fail"
}

# `--self-test` runs THE GATE against a known-bad tree and requires it to refuse, then asserts
# the tree it would really scan is not empty. A check never watched failing is not a check, and
# this block was once deleted during a refactor while the flag went on printing success.
if [ "${1:-}" = "--self-test" ]; then
  fixtures="scripts/fixtures/identity-bad"
  [ -d "$fixtures" ] || { echo "identity gate self-test FAILED: $fixtures is missing" >&2; exit 1; }

  output=$(find "$fixtures" -type f | scan 2>&1) && {
    echo "identity gate self-test FAILED: the gate passed a known-bad tree" >&2; exit 1; }

  hits=$(printf '%s\n' "$output" | grep -cE "$PATTERN" || true)
  if [ "$hits" -lt 4 ]; then
    echo "identity gate self-test FAILED: the identity rule reported $hits match(es), expected 4 or more" >&2
    printf '%s\n' "$output" >&2
    exit 1
  fi
  printf '%s\n' "$output" | grep -q "publisher law violated" || {
    echo "identity gate self-test FAILED: the publisher rule never fired on the fixture" >&2
    printf '%s\n' "$output" >&2
    exit 1; }

  # A gutted file list is the failure the empty-list refusal exists for; this proves the real
  # list is populated, so the gate that just refused a bad tree is also looking at a real one.
  count=$(tracked | wc -l)
  if [ "$count" -lt 20 ]; then
    echo "identity gate self-test FAILED: only $count tracked file(s) would be scanned" >&2; exit 1
  fi

  echo "identity gate self-test: refused a known-bad tree on $hits identity match(es) and on the publisher rule, over $count real file(s)"
  exit 0
fi

tracked | scan
echo "identity gate: clean"
