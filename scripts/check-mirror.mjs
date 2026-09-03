#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Organization rule 5: test/ mirrors src/ exactly. One test file per source file, same path.
// Both directions matter. A source with no test is untested; a test with no source is a test of
// something that has been deleted, and it goes on passing.
//
// index.ts files are re-export surfaces with nothing of their own to exercise, so they are
// mirrored by the package's exports gate instead and are exempt here.
//
// --self-test runs it against scripts/fixtures/mirror-bad/, which is missing a test and carries
// an orphan, so both halves are watched failing.
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

// Same hole as the organization gate had: a source file the walker cannot see needs no test.
const SOURCE = /\.(ts|tsx|mts|cts)$/;

// Maps the extensionless path to the real file, so a message names a file that exists. Keying
// on the stripped path and rebuilding it with ".ts" reported "probe.ts" for a "probe.mts",
// which sends whoever reads it looking for a file that was never there.
const listing = (root, suffix) => {
  const found = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (suffix === ".ts" && SOURCE.test(path) && !path.endsWith(".d.ts")) {
        found.set(relative(root, path).replace(SOURCE, ""), path);
      } else if (suffix !== ".ts" && path.endsWith(suffix)) {
        found.set(relative(root, path).slice(0, -suffix.length), path);
      }
    }
  };
  try {
    statSync(root);
  } catch {
    return found;
  }
  walk(root);
  return found;
};

export function checkPair(srcRoot, testRoot) {
  const problems = [];
  const sources = listing(srcRoot, ".ts");
  const tests = listing(testRoot, ".test.ts");
  for (const [key, path] of [...sources].sort()) {
    // An entry point is covered by the tests of what it wires together. `bin` is exempt for the
    // same reason `index` is, and it cannot hide logic: the organization gate's rule 2 refuses
    // any declaration in either of them.
    if (key.endsWith("index") || key.endsWith("bin")) continue;
    if (!tests.has(key)) problems.push(`${path} has no ${join(testRoot, key)}.test.ts`);
  }
  for (const [key, path] of [...tests].sort()) {
    if (!sources.has(key)) problems.push(`${path} mirrors no source file`);
  }
  return problems;
}

// This module is imported by its own tests and by other tooling, so the command-line body only
// runs when it IS the command.
const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const fixture = "scripts/fixtures/mirror-bad";
    try {
      statSync(fixture);
    } catch {
      console.error(`mirror gate self-test FAILED: ${fixture} is missing`);
      process.exit(1);
    }
    const found = checkPair(join(fixture, "src"), join(fixture, "test"));
    const missing = found.some((p) => p.includes("has no"));
    const orphan = found.some((p) => p.includes("mirrors no source"));
    if (!missing || !orphan) {
      console.error(
        "mirror gate self-test FAILED: it must catch both a missing test and an orphan",
      );
      for (const p of found) console.error(`  saw: ${p}`);
      process.exit(1);
    }
    console.log("mirror gate self-test: red on a missing test and on an orphan, as required");
    process.exit(0);
  }

  const problems = [];
  let pairs = 0;
  for (const pkg of readdirSync("packages", { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    const src = join("packages", pkg.name, "src");
    try {
      statSync(src);
    } catch {
      continue;
    }
    problems.push(...checkPair(src, join("packages", pkg.name, "test")));
    pairs++;
  }
  if (problems.length) {
    console.error(`mirror check failed, ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`mirror check: clean (${pairs} package(s))`);
}
