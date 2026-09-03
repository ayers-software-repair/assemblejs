#!/usr/bin/env bash
# Copyright Ayers Electronics Inc. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
# PostToolUse: reformat the file that was just written. Never blocks.
set -euo pipefail
input="$(cat)"
file_path="$(printf '%s' "$input" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{const j=JSON.parse(d);process.stdout.write(j.tool_input?.file_path||"")}catch{process.stdout.write("")}})')"
case "$file_path" in
  *.ts|*.tsx|*.mts|*.mjs|*.json|*.md|*.yml|*.yaml)
    [ -f "$file_path" ] && (cd "${CLAUDE_PROJECT_DIR:-.}" && pnpm exec prettier --write "$file_path" >/dev/null 2>&1 || true) ;;
esac
exit 0
