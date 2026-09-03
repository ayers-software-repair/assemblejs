#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Every subpath a package declares must import under plain node, and every path it does not
// declare must be refused. The second half is the point: an exports map that encapsulates
// nothing is a map that will be reached around, and the reaching is invisible until it ships.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const NEVER_EXPORTED = ["./dist/index.js", "./src/index.ts", "./package.json/../src", "./internal"];
const failures = [];
let checked = 0;

async function importable(specifier) {
  try {
    await import(specifier);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: error.code ?? "UNKNOWN", message: error.message };
  }
}

for (const entry of readdirSync("packages", { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = join("packages", entry.name);
  const manifestPath = join(dir, "package.json");
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.exports) {
    failures.push(`${manifest.name}: declares no exports map, so nothing is encapsulated`);
    continue;
  }

  // Resolution is relative to the package's own directory, which is where a self-reference
  // resolves the way a dependent's would.
  const from = pathToFileURL(join(resolve(dir), "noop.js")).href;
  const { createRequire } = await import("node:module");
  const require = createRequire(from);

  for (const subpath of Object.keys(manifest.exports)) {
    if (subpath.endsWith("package.json")) continue;
    const specifier = subpath === "." ? manifest.name : `${manifest.name}${subpath.slice(1)}`;
    let resolved;
    try {
      resolved = pathToFileURL(require.resolve(specifier)).href;
    } catch (error) {
      failures.push(
        `${manifest.name}: declares "${subpath}" but it does not resolve (${error.code})`,
      );
      continue;
    }
    const result = await importable(resolved);
    if (!result.ok)
      failures.push(`${manifest.name}: "${subpath}" does not import (${result.code})`);
    checked++;
  }

  for (const forbidden of NEVER_EXPORTED) {
    const specifier = `${manifest.name}${forbidden.slice(1)}`;
    let refused = false;
    try {
      require.resolve(specifier);
    } catch (error) {
      refused = error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED" || error.code === "MODULE_NOT_FOUND";
    }
    if (!refused) {
      failures.push(
        `${manifest.name}: "${specifier}" resolves, so the exports map encapsulates nothing`,
      );
    }
    checked++;
  }
}

if (failures.length) {
  console.error("exports check failed:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`exports check: clean (${checked} path(s))`);
