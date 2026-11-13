// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The fixed group moves every package together. Internal dependencies, including peers, use
// workspace:* so packing resolves the same current version instead of retaining an old one.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const GROUP = "@asmjs/*";
const STARTER = "create-assemblejs";

/** Every problem with the versions and the fixed group, one line each. */
export function problems(packages, config) {
  const found = [];
  if (!packages.some((pkg) => pkg.name === STARTER)) found.push(`missing ${STARTER}`);
  const versions = new Set(packages.map((p) => p.version));
  if (versions.size > 1) {
    found.push(`the packages name ${String(versions.size)} versions: ${[...versions].join(", ")}`);
  }
  const fixed = Array.isArray(config.fixed) ? config.fixed : [];
  const whole =
    fixed.length === 1 &&
    Array.isArray(fixed[0]) &&
    fixed[0].length === 2 &&
    fixed[0][0] === GROUP &&
    fixed[0][1] === STARTER;
  if (!whole) found.push(`.changeset/config.json "fixed" is not [["${GROUP}", "${STARTER}"]]`);
  for (const pkg of packages) {
    if (!pkg.name.startsWith("@asmjs/") && pkg.name !== STARTER)
      found.push(`${pkg.name} is outside the fixed group`);
    for (const field of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      for (const [name, version] of Object.entries(pkg[field] ?? {})) {
        if ((name.startsWith("@asmjs/") || name === STARTER) && version !== "workspace:*") {
          found.push(`${pkg.name} ${field}.${name} must use workspace:* instead of ${version}`);
        }
      }
    }
  }
  return found;
}

/** Every package under packages/, its name and version. */
export function readPackages(root) {
  const dir = join(root, "packages");
  return readdirSync(dir)
    .map((entry) => join(dir, entry, "package.json"))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, "utf8")));
}

if (process.argv[2] === "--self-test") {
  const good = [
    { name: "@asmjs/core", version: "1.0.0-next.0" },
    { name: "@asmjs/cli", version: "1.0.0-next.0" },
    { name: STARTER, version: "1.0.0-next.0" },
  ];
  assert.deepEqual(problems(good, { fixed: [[GROUP, STARTER]] }), []);
  assert.equal(
    problems([good[0], { ...good[1], version: "1.0.1" }, good[2]], { fixed: [[GROUP, STARTER]] })
      .length,
    1,
  );
  assert.equal(problems(good, { fixed: [] }).length, 1);
  assert.equal(problems(good, { fixed: [[GROUP]] }).length, 1);
  assert.deepEqual(problems(good.slice(0, 2), { fixed: [[GROUP, STARTER]] }), [
    `missing ${STARTER}`,
  ]);
  assert.equal(problems(good, { fixed: [["@asmjs/core"]] }).length, 1);
  assert.equal(
    problems([...good, { name: "other", version: "1.0.0-next.0" }], { fixed: [[GROUP, STARTER]] })
      .length,
    1,
  );
  for (const field of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    const stale = { ...good[1], [field]: { "@asmjs/core": "1.0.0-next.0" } };
    assert.equal(problems([good[0], stale, good[2]], { fixed: [[GROUP, STARTER]] }).length, 1);
    assert.deepEqual(
      problems(
        [
          good[0],
          { ...good[1], [field]: { "@asmjs/core": "workspace:*", external: "^1.0.0" } },
          good[2],
        ],
        { fixed: [[GROUP, STARTER]] },
      ),
      [],
    );
  }
  console.log(
    "one-version gate self-test: red on a second version, a missing group, a partial group and a package outside it and stale internal dependency/peer versions, as required",
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
