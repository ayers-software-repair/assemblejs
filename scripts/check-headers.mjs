#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Every source file under packages/*/src carries the two-line header, in the first four lines.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REQUIRED = [
  "// Copyright Ayers Electronics Inc. All rights reserved.",
  "// SPDX-License-Identifier: Apache-2.0",
];
const SKIP = new Set(["node_modules", "dist", "coverage"]);
const failures = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|mts|cts|js|mjs)$/.test(p) && !p.endsWith(".d.ts")) {
      const head = readFileSync(p, "utf8").split("\n").slice(0, 4).join("\n");
      if (!REQUIRED.every((line) => head.includes(line))) failures.push(p);
    }
  }
}

let checked = 0;
for (const pkg of readdirSync("packages", { withFileTypes: true })) {
  if (!pkg.isDirectory()) continue;
  const src = join("packages", pkg.name, "src");
  try {
    statSync(src);
  } catch {
    continue;
  }
  walk(src);
  checked++;
}
if (failures.length) {
  console.error(`Missing header in ${failures.length} file(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`header check: clean (${checked} package source tree(s))`);
