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
EXCLUDES=(--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=.changeset --exclude-dir=coverage --exclude-dir=fixtures --exclude=identity-gate.sh --exclude=pnpm-lock.yaml)

if [ "${1:-}" = "--self-test" ]; then
  hits=$(grep -rEIl "$PATTERN" scripts/fixtures/identity-bad || true)
  n=$(printf '%s\n' "$hits" | sed '/^$/d' | wc -l)
  if [ "$n" -lt 4 ]; then
    echo "identity gate self-test FAILED: expected at least 4 fixture hits, got $n" >&2
    exit 1
  fi
  if grep -rEIl "Ayers Software Repair" scripts/fixtures/identity-bad >/dev/null; then :; else
    echo "identity gate self-test FAILED: publisher fixture missing" >&2
    exit 1
  fi
  echo "identity gate self-test: red on $n fixture(s) as required"
  exit 0
fi

fail=0
if grep -rEIn "${EXCLUDES[@]}" "$PATTERN" . ; then
  echo "identity gate: forbidden identity string found (matches above)" >&2
  fail=1
fi
while IFS= read -r pj; do
  if grep -n "Ayers Software Repair" "$pj"; then
    echo "identity gate: publisher law violated in $pj" >&2
    fail=1
  fi
done < <(find . -name package.json -not -path '*/node_modules/*' -not -path '*/fixtures/*')
if [ "$fail" -ne 0 ]; then exit 1; fi
echo "identity gate: clean"
