#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The first publish of a name npm has never seen.
//
// npm only lets a package that already exists be given a trusted publisher, so a name's first
// version cannot go out tokenless. The release workflow runs this before `changeset publish`:
// it asks the registry about every public package, and publishes the unseen ones with the one
// token in NODE_AUTH_TOKEN (the NPM_TOKEN secret of the `release` environment). Once every name
// is on the registry it does nothing, and trusted publishing publishes.
//
//   node scripts/first-publish.mjs                     one line per package: seen or unseen
//   node scripts/first-publish.mjs --publish <tag>     publish the unseen ones under that npm tag
//   node scripts/first-publish.mjs --self-test
//
// An answer is "unseen" only when the registry says 404. Any other failure is a red: guessing
// "unseen" on a dropped connection would publish over a name that exists.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The public packages, in directory order: their names and where they live. */
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
    .map(({ name, dir }) => ({ name, dir }));
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

/** Packs the package with pnpm, which writes the real versions over `workspace:*`, then publishes the tarball. */
export function publishPackage({ dir }, tag, token) {
  const out = mkdtempSync(join(tmpdir(), "first-publish-"));
  try {
    const pack = spawnSync("pnpm", ["pack", "--json", "--pack-destination", out], {
      cwd: dir,
      encoding: "utf8",
    });
    if (pack.status !== 0) throw new Error(`pnpm pack failed in ${dir}: ${pack.stderr}`);
    const { filename } = JSON.parse(pack.stdout);
    const publish = spawnSync(
      "npm",
      ["publish", filename, "--access", "public", "--provenance", "--tag", tag],
      {
        stdio: "inherit",
        env: { ...process.env, "npm_config_//registry.npmjs.org/:_authToken": token },
      },
    );
    if (publish.status !== 0) throw new Error(`npm publish failed for ${dir}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/** Reports the packages' state; with a tag, publishes the unseen ones. Returns the unseen names. */
export function firstPublish({ packages, knows, publish, tag, token, say = console.log }) {
  const unseen = [];
  for (const pkg of packages) {
    const seen = knows(pkg.name);
    if (!tag) say(`${seen ? "seen" : "unseen"} ${pkg.name}`);
    if (!seen) unseen.push(pkg);
  }
  if (!tag) return unseen.map((pkg) => pkg.name);
  if (unseen.length === 0) {
    say("every name is on the registry; trusted publishing publishes");
    return [];
  }
  const names = unseen.map((pkg) => pkg.name).join(", ");
  if (!token) {
    throw new Error(
      `${names} ${unseen.length === 1 ? "is a name" : "are names"} npm has never seen and need the NPM_TOKEN secret of the release environment, which is empty.`,
    );
  }
  for (const pkg of unseen) {
    say(`publishing ${pkg.name} under ${tag}`);
    publish(pkg, tag, token);
  }
  return unseen.map((pkg) => pkg.name);
}

function selfTest() {
  const packages = [
    { name: "@x/core", dir: "a" },
    { name: "@x/cli", dir: "b" },
    { name: "@x/build", dir: "c" },
  ];
  const known = new Set(["@x/cli"]);
  const run = (over) => {
    const published = [];
    const said = [];
    const args = {
      packages,
      knows: (name) => known.has(name),
      publish: (pkg, tag, token) => published.push([pkg.name, tag, token]),
      say: (line) => said.push(line),
      ...over,
    };
    try {
      firstPublish(args);
      return { published, said };
    } catch (error) {
      return { published, said, error };
    }
  };

  const report = run({});
  assert.deepEqual(report.said, ["unseen @x/core", "seen @x/cli", "unseen @x/build"]);

  const noToken = run({ tag: "next", token: "" });
  assert.match(
    noToken.error?.message ?? "",
    /@x\/core, @x\/build .*NPM_TOKEN.*release environment/,
  );
  assert.deepEqual(noToken.published, []);

  const withToken = run({ tag: "next", token: "t" });
  assert.deepEqual(withToken.published, [
    ["@x/core", "next", "t"],
    ["@x/build", "next", "t"],
  ]);

  for (const token of ["", "t"]) {
    const allSeen = run({ tag: "next", token, knows: () => true });
    assert.deepEqual(allSeen.published, []);
    assert.deepEqual(allSeen.said, ["every name is on the registry; trusted publishing publishes"]);
  }

  const offline = run({
    tag: "next",
    token: "t",
    knows: () => {
      throw new Error("npm view failed: ECONNREFUSED");
    },
  });
  assert.match(offline.error?.message ?? "", /ECONNREFUSED/);
  assert.deepEqual(offline.published, []);

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
      ["a", { name: "@x/a" }],
      ["b", { name: "@x/b", private: true }],
    ]) {
      mkdirSync(join(root, dir));
      writeFileSync(join(root, dir, "package.json"), JSON.stringify(body));
    }
    assert.deepEqual(
      publicPackages(root).map((pkg) => pkg.name),
      ["@x/a"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  console.log(
    "first publish: unseen without a token is red, with one publishes only the unseen, " +
      "all seen publishes nothing, only a 404 is unseen and a network failure is red, " +
      "a private package is never asked about",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [flag, tag] = process.argv.slice(2);
  if (flag === "--self-test") selfTest();
  else {
    if (flag === "--publish" && !tag) throw new Error("--publish needs an npm tag.");
    try {
      firstPublish({
        packages: publicPackages(),
        knows: registryKnows,
        publish: publishPackage,
        tag: flag === "--publish" ? tag : undefined,
        token: process.env.NODE_AUTH_TOKEN,
      });
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
