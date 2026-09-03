#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# The identity gate. Two rules, both hard:
#   1. No forbidden identity string anywhere in the tree (the legacy package name, the legacy
#      handle, the retired brand, any iCloud address).
#   2. The publisher law: "Ayers Software Repair" appears on no package-metadata surface
#      (any package.json). Publisher is Ayers Electronics; copyright is Ayers Electronics Inc.
# `--self-test` runs the gate against scripts/fixtures/identity-bad/ and REQUIRES it to fail:
# a gate that cannot fail is not a gate.
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='zjayers|MeridianVega|asmbl|icloud'

# THE GATE SCANS WHAT GIT TRACKS, not the working tree.
# Only a tracked file can be committed, published, or shipped in a tarball; an ignored or
# untracked file is none of those. `git ls-files` covers tracked AND staged, so a new file
# reaches the gate at the moment it could first enter history, which is where it matters.
# Scanning the whole tree instead would fail on scratch files that can never ship, and a gate
# that fails on things that do not matter is a gate people learn to skip.
tracked() {
  git ls-files -c -- . \
    | grep -vE '^(scripts/identity-gate\.sh|scripts/fixtures/|pnpm-lock\.yaml|docs/dossiers/)'
}

# `--self-test` runs the gate's own patterns against scripts/fixtures/identity-bad/ and REQUIRES
# them to match. A check never watched failing is not a check. This block was once deleted during
# a refactor and the flag then printed success without running anything, which is the exact
# failure it exists to catch, so every precondition is asserted rather than assumed.
if [ "${1:-}" = "--self-test" ]; then
  fixtures="scripts/fixtures/identity-bad"
  [ -d "$fixtures" ] || { echo "identity gate self-test FAILED: $fixtures is missing" >&2; exit 1; }
  hits=$(grep -rEIl "$PATTERN" "$fixtures" | wc -l)
  if [ "$hits" -lt 4 ]; then
    echo "identity gate self-test FAILED: patterns matched $hits fixture(s), expected at least 4" >&2
    exit 1
  fi
  grep -rIl "Ayers Software Repair" "$fixtures" >/dev/null || {
    echo "identity gate self-test FAILED: no publisher-law fixture" >&2; exit 1; }
  echo "identity gate self-test: red on $hits fixture(s) and on the publisher fixture, as required"
  exit 0
fi

fail=0
if tracked | xargs -r grep -EIn "$PATTERN" ; then
  echo "identity gate: forbidden identity string found (matches above)" >&2
  fail=1
fi
while IFS= read -r pj; do
  if grep -n "Ayers Software Repair" "$pj"; then
    echo "identity gate: publisher law violated in $pj" >&2
    fail=1
  fi
done < <(tracked | grep -E '(^|/)package\.json$')
if [ "$fail" -ne 0 ]; then exit 1; fi
echo "identity gate: clean"
