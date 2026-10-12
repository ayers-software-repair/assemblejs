// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The thirteen packages share one version (owner, DECISIONS 2026-10-11, "One number"). Two things
// make that true and this gate holds both: every packages/*/package.json names the same version,
// and .changeset/config.json keeps every package in one fixed group, so a changeset to any of
// them moves them all. A package left out of the group would be versioned alone, and the
// release-notes gate and a new project's manifest both assume it never is.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GROUP = "@assemblejs/*";

/** Every problem with the versions and the fixed group, one line each. */
export function problems(packages, config) {
  const found = [];
  const versions = new Set(packages.map((p) => p.version));
  if (versions.size > 1) {
    found.push(`the packages name ${String(versions.size)} versions: ${[...versions].join(", ")}`);
  }
  const fixed = Array.isArray(config.fixed) ? config.fixed : [];
  const whole = fixed.length === 1 && fixed[0].length === 1 && fixed[0][0] === GROUP;
  if (!whole) found.push(`.changeset/config.json "fixed" is not [["${GROUP}"]]`);
  for (const { name } of packages) {
    if (!name.startsWith("@assemblejs/")) found.push(`${name} is outside the fixed group`);
  }
  return found;
}

/** Every package under packages/, its name and version. */
export function readPackages(root) {
  const dir = join(root, "packages");
  return readdirSync(dir)
    .map((entry) => join(dir, entry, "package.json"))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, "utf8")))
    .map(({ name, version }) => ({ name, version }));
}

if (process.argv[2] === "--self-test") {
  const good = [
    { name: "@assemblejs/core", version: "1.0.0-next.0" },
    { name: "@assemblejs/cli", version: "1.0.0-next.0" },
  ];
  assert.deepEqual(problems(good, { fixed: [[GROUP]] }), []);
  assert.equal(
    problems([good[0], { ...good[1], version: "1.0.1" }], { fixed: [[GROUP]] }).length,
    1,
  );
  assert.equal(problems(good, { fixed: [] }).length, 1);
  assert.equal(problems(good, { fixed: [["@assemblejs/core"]] }).length, 1);
  assert.equal(
    problems([...good, { name: "other", version: "1.0.0-next.0" }], { fixed: [[GROUP]] }).length,
    1,
  );
  console.log(
    "one-version gate self-test: red on a second version, a missing group, a partial group and a package outside it, as required",
  );
} else if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const found = problems(
    readPackages(root),
    JSON.parse(readFileSync(join(root, ".changeset/config.json"), "utf8")),
  );
  if (found.length > 0) {
    console.error(`one version: ${String(found.length)} problem(s):`);
    for (const line of found) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log("one version: every package names it, and one fixed group moves them together");
}
