#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Packs every workspace package dry and fails if the tarball would carry anything but the
// allowlist: tests, docs, fixtures, source maps of tests, config. The legacy build shipped its
// whole test suite; this is the gate that keeps that from recurring. It fails too if a tarball
// packs to more bytes than scripts/size-budgets.json allows it, or has no budget there at all: a
// package nobody measured grows unnoticed, and a budget is raised on purpose, in a change that
// says why. Before it checks, it watches itself refuse a known-bad input: a package carrying a
// test file, one a byte over its budget and one with no budget, so a self-test that never ran
// cannot be trusted.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
const BUDGETS = "scripts/size-budgets.json";

/** Every package's dry pack: its name, the files it would ship, and its packed size in bytes. */
function packAll() {
  const packed = [];
  for (const d of readdirSync("packages", { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = join("packages", d.name);
    if (!existsSync(join(dir, "package.json"))) continue;
    const out = execSync("npm pack --dry-run --json --ignore-scripts", {
      cwd: dir,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
    const [{ files, name, size }] = JSON.parse(out);
    packed.push({ name, files, size });
  }
  return packed;
}

/** Everything wrong with the packs against the allowlist and the budgets, one line each. */
function problemsOf(packed, budgets) {
  const problems = [];
  for (const { name, files, size } of packed) {
    for (const f of files) {
      if (FORBIDDEN.some((re) => re.test(f.path))) {
        problems.push(`${name}: tarball would ship forbidden path ${f.path}`);
      }
    }
    const budget = budgets[name];
    if (typeof budget !== "number") problems.push(`${name}: has no size budget in ${BUDGETS}`);
    else if (size > budget)
      problems.push(`${name}: packs to ${size} bytes, over its budget of ${budget}`);
  }
  for (const name of Object.keys(budgets)) {
    if (!packed.some((entry) => entry.name === name)) {
      problems.push(`${name}: is budgeted in ${BUDGETS} but is not a package`);
    }
  }
  return problems;
}

let packed;
try {
  packed = packAll();
} catch (error) {
  console.error(`pack check: could not pack: ${error.message}`);
  process.exit(1);
}
if (packed.length < 2) {
  console.error(`pack check: found ${packed.length} package(s) under packages/, too few to check`);
  process.exit(1);
}
let budgets;
try {
  budgets = JSON.parse(readFileSync(BUDGETS, "utf8"));
} catch (error) {
  console.error(`pack check: ${BUDGETS} cannot be read: ${error.message}`);
  process.exit(1);
}
if (budgets === null || typeof budgets !== "object" || Array.isArray(budgets)) {
  console.error(`pack check: ${BUDGETS} is not an object of package names and bytes`);
  process.exit(1);
}

// The self-test: a package shipping a test file, a budget a byte too small and a package with
// none, each refused by name, before the real check is believed.
const [first, second] = packed;
const bad = { ...budgets, [first.name]: first.size - 1, "@assemblejs/self-test": 1 };
delete bad[second.name];
const shipping = { name: "@assemblejs/self-test", files: [{ path: "dist/x.test.js" }], size: 1 };
const seen = problemsOf([...packed, shipping], bad);
const required = [
  `${first.name}: packs to ${first.size} bytes, over its budget of ${first.size - 1}`,
  `${second.name}: has no size budget in ${BUDGETS}`,
  "@assemblejs/self-test: tarball would ship forbidden path dist/x.test.js",
];
if (!required.every((line) => seen.includes(line))) {
  console.error("pack check self-test: FAILED to refuse a known-bad input");
  process.exit(1);
}
console.log("pack check self-test: red on a known-bad input, as required");

const problems = problemsOf(packed, budgets);
for (const line of problems) console.error(line);
for (const { name, files, size } of packed) {
  console.log(`${name}: ${files.length} files, ${size} bytes of ${budgets[name] ?? "no"} budget`);
}
console.log(
  `pack check: ${packed.length} package(s)${problems.length > 0 ? ", FAILED" : ", clean"}`,
);
process.exit(problems.length > 0 ? 1 : 0);
