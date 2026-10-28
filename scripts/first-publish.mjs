#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The guard for a name npm has never seen.
//
// npm only lets a package that already exists be given a trusted publisher, so the release
// workflow, which publishes through trusted publishing alone, cannot publish a name's first
// version. The owner publishes it once by hand with his second factor (docs/FIRST-PUBLISH.md).
// The release workflow runs this before `changeset publish`: it asks the registry about every
// public package and fails, naming each unseen one with the command that publishes it by hand.
// Once every name is on the registry it passes, and trusted publishing publishes.
//
//   node scripts/first-publish.mjs <tag>       seen or unseen per package; red on any unseen
//   node scripts/first-publish.mjs --self-test
//
// An answer is "unseen" only when the registry says 404. Any other failure is a red: guessing
// "unseen" on a dropped connection would send the owner to publish over a name that exists.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The public packages, in directory order: their names, versions and where they live. */
export function publicPackages(root = "packages") {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((dir) => ({
      dir: join(root, dir),
      ...JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8")),
    }))
    .filter((item) => !item.private)
    .map(({ name, version, dir }) => ({ name, version, dir }));
}

/** Runs `npm view <name> name --json`; its stdout is JSON on success and on an npm error alike. */
const npmView = (name) => spawnSync("npm", ["view", name, "name", "--json"], { encoding: "utf8" });

/** Whether npm's registry knows the name: true, false on a 404, a throw on anything else. */
export function registryKnows(name, view = npmView) {
  const run = view(name);
  let answer;
  try {
    answer = JSON.parse(run.stdout);
  } catch {
    throw new Error(`npm view ${name} gave no JSON answer: ${run.stderr || run.error || "empty"}`);
  }
  if (run.status === 0 && answer === name) return true;
  if (answer?.error?.code === "E404") return false;
  throw new Error(`npm view ${name} failed: ${answer?.error?.code ?? "unexpected answer"}`);
}

/**
 * The command that publishes a package's first version by hand, run from the repository root
 * after a build. pnpm packs it, writing real versions where the workspace says `workspace:*`;
 * npm publishes the tarball, which pnpm names `<scope>-<name>-<version>.tgz`, and asks for the
 * second factor. Provenance is off because it can only be made in CI; `--tag` is required for
 * a prerelease.
 */
export function handCommand({ name, version, dir }, tag) {
  const tarball = `${name.slice(1).replace("/", "-")}-${version}.tgz`;
  return (
    `(cd ${dir} && pnpm pack && npm publish ./${tarball} --access public --tag ${tag} ` +
    `--provenance=false && rm ${tarball})`
  );
}

/** Reports each package as seen or unseen; throws on any unseen, naming its hand command. */
export function firstPublish({ packages, knows, tag, say = console.log }) {
  const unseen = packages.filter((pkg) => {
    const seen = knows(pkg.name);
    say(`${seen ? "seen" : "unseen"} ${pkg.name}`);
    return !seen;
  });
  if (unseen.length === 0) {
    say("every name is on the registry; trusted publishing publishes");
    return;
  }
  throw new Error(
    [
      `${unseen.length === 1 ? "a name" : "names"} npm has never seen, which trusted publishing ` +
        "cannot publish. The owner publishes each once by hand (docs/FIRST-PUBLISH.md):",
      ...unseen.map((pkg) => handCommand(pkg, tag)),
    ].join("\n"),
  );
}

function selfTest() {
  const packages = [
    { name: "@x/core", version: "1.0.0-next.1", dir: "packages/core" },
    { name: "@x/cli", version: "1.0.0-next.1", dir: "packages/cli" },
    { name: "@x/build", version: "1.0.0-next.1", dir: "packages/build" },
  ];
  const known = new Set(["@x/cli"]);
  const run = (over) => {
    const said = [];
    try {
      firstPublish({
        packages,
        tag: "next",
        knows: (name) => known.has(name),
        say: (line) => said.push(line),
        ...over,
      });
      return { said };
    } catch (error) {
      return { said, error };
    }
  };

  const someUnseen = run({});
  assert.deepEqual(someUnseen.said, ["unseen @x/core", "seen @x/cli", "unseen @x/build"]);
  const lines = someUnseen.error?.message.split("\n") ?? [];
  assert.match(lines[0] ?? "", /^names npm has never seen.*by hand/);
  assert.deepEqual(lines.slice(1), [
    "(cd packages/core && pnpm pack && npm publish ./x-core-1.0.0-next.1.tgz --access public " +
      "--tag next --provenance=false && rm x-core-1.0.0-next.1.tgz)",
    "(cd packages/build && pnpm pack && npm publish ./x-build-1.0.0-next.1.tgz --access public " +
      "--tag next --provenance=false && rm x-build-1.0.0-next.1.tgz)",
  ]);

  const allSeen = run({ knows: () => true });
  assert.equal(allSeen.error, undefined);
  assert.equal(allSeen.said.at(-1), "every name is on the registry; trusted publishing publishes");

  const offline = run({
    knows: () => {
      throw new Error("npm view failed: ECONNREFUSED");
    },
  });
  assert.match(offline.error?.message ?? "", /ECONNREFUSED/);

  const answer = (status, body) => () => ({ status, stdout: JSON.stringify(body), stderr: "" });
  assert.equal(registryKnows("@x/a", answer(0, "@x/a")), true);
  assert.equal(registryKnows("@x/a", answer(1, { error: { code: "E404" } })), false);
  for (const code of ["ECONNREFUSED", "E500"])
    assert.throws(() => registryKnows("@x/a", answer(1, { error: { code } })), new RegExp(code));
  assert.throws(
    () => registryKnows("@x/a", () => ({ status: 1, stdout: "", stderr: "offline" })),
    /no JSON/,
  );

  const root = mkdtempSync(join(tmpdir(), "first-publish-test-"));
  try {
    for (const [dir, body] of [
      ["a", { name: "@x/a", version: "1.0.0" }],
      ["b", { name: "@x/b", private: true }],
    ]) {
      mkdirSync(join(root, dir));
      writeFileSync(join(root, dir, "package.json"), JSON.stringify(body));
    }
    assert.deepEqual(publicPackages(root), [
      { name: "@x/a", version: "1.0.0", dir: join(root, "a") },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  console.log(
    "first publish: an unseen name is red and named with its hand command, all seen passes, " +
      "only a 404 is unseen and a network failure is red, a private package is never asked about",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [arg] = process.argv.slice(2);
  if (arg === "--self-test") selfTest();
  else {
    if (!arg) throw new Error("name the npm tag: node scripts/first-publish.mjs <tag>");
    try {
      firstPublish({ packages: publicPackages(), knows: registryKnows, tag: arg });
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
