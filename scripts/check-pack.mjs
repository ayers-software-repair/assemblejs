#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Packs every workspace package dry and fails if the tarball would carry anything but the
// allowlist: tests, docs, fixtures, source maps of tests, config. The legacy build shipped its
// whole test suite; this is the gate that keeps that from recurring.
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  /__tests__\//,
  /\.test\./,
  /\.spec\./,
  /^docs\//,
  /typedoc/,
  /fixtures\//,
  /tsconfig/,
  /vitest\.config/,
  /tsup\.config/,
  /\.map$/,
];
let failed = false;
let packed = 0;
for (const d of readdirSync("packages", { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const dir = join("packages", d.name);
  if (!existsSync(join(dir, "package.json"))) continue;
  const out = execSync("npm pack --dry-run --json --ignore-scripts", {
    cwd: dir,
    stdio: ["ignore", "pipe", "ignore"],
  }).toString();
  const [{ files, name, size }] = JSON.parse(out);
  packed++;
  for (const f of files) {
    if (FORBIDDEN.some((re) => re.test(f.path))) {
      console.error(`${name}: tarball would ship forbidden path ${f.path}`);
      failed = true;
    }
  }
  console.log(`${name}: ${files.length} files, ${size} bytes`);
}
console.log(`pack check: ${packed} package(s)${failed ? ", FAILED" : ", clean"}`);
process.exit(failed ? 1 : 0);
