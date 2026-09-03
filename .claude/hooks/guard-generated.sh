#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
# PreToolUse: refuse hand edits to machine-written paths. Exit 2 blocks the tool call.
set -euo pipefail
input="$(cat)"
file_path="$(printf '%s' "$input" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const j=JSON.parse(d);process.stdout.write(j.tool_input?.file_path||"")}catch{process.stdout.write("")}})')"
[ -z "$file_path" ] && exit 0
case "$file_path" in
  */dist/*|*/pnpm-lock.yaml|pnpm-lock.yaml)
    echo "BLOCKED: $file_path is machine-written. Run the build or pnpm install instead of editing it." >&2
    exit 2 ;;
esac
exit 0
