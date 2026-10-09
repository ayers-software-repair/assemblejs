// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// A vitest global setup every package's suite runs under, beside test-temp-root.mjs: a test
// that reads a built package reads one built from the source beside it. Before the first test
// runs, every workspace package whose dist is missing or older than its source is built, in one
// pnpm invocation so dependencies build first. When nothing is stale this costs a stat per file.
// The owner's rule (2026-10-09): tests build what they use.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagesDir = join(root, "packages");

// The newest and oldest modification times under a path, a file or a directory walked whole; a
// missing path has neither.
function times(path) {
  let stat;
  try {
    stat = statSync(path);
  } catch {
    return { newest: 0, oldest: Infinity };
  }
  if (!stat.isDirectory()) return { newest: stat.mtimeMs, oldest: stat.mtimeMs };
  let newest = 0;
  let oldest = Infinity;
  for (const entry of readdirSync(path)) {
    const inner = times(join(path, entry));
    newest = Math.max(newest, inner.newest);
    oldest = Math.min(oldest, inner.oldest);
  }
  return { newest, oldest };
}

// Stale: no build at all, or any input written after the oldest built file.
function isStale(dir) {
  const built = times(join(dir, "dist")).oldest;
  if (!Number.isFinite(built)) return true;
  const inputs = ["src", "package.json", "tsup.config.ts"].map((name) => times(join(dir, name)));
  return Math.max(...inputs.map((input) => input.newest)) > built;
}

export default function setup() {
  const stale = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name))
    .filter((dir) => isStale(dir))
    .map((dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name);
  if (stale.length === 0) return;
  console.warn(`build-when-stale: building ${stale.join(", ")}`);
  execFileSync("pnpm", [...stale.flatMap((name) => ["--filter", name]), "build"], {
    cwd: root,
    stdio: "inherit",
  });
}
