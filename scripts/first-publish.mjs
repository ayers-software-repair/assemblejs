#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The first publish of a name npm has never seen, staged for the owner to approve.
//
// npm only lets a package that already exists be given a trusted publisher, so a name's first
// version cannot go out tokenless. The release workflow runs this before `changeset publish`:
// it asks the registry about every public package and stages the unseen ones with
// `npm stage publish`, using the stage-only token in NODE_AUTH_TOKEN (the NPM_STAGE_TOKEN
// secret of the `release` environment). A stage-only token cannot publish; a staged version
// goes live only when a maintainer approves it with his second factor. When it stages anything
// the run stops red, before `changeset publish`, naming what waits for approval. Once every
// name is on the registry it does nothing, needs no token, and trusted publishing publishes.
//
//   node scripts/first-publish.mjs                   one line per package: seen or unseen
//   node scripts/first-publish.mjs --stage <tag>     stage the unseen ones under that npm tag
//   node scripts/first-publish.mjs --self-test
//
// A name is "unseen" when the registry says 404, or holds only the placeholder npm writes when a
// new name is staged. Any other failure is a red: guessing "unseen" on a dropped connection
// would stage over a name that exists.
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

/** The version npm writes for a new name while its first version waits in staging. */
const STAGE_PLACEHOLDER = "0.0.0-stage";

/** Runs `npm view <name> versions --json`; its stdout is JSON on success and on an error alike. */
const npmView = (name) =>
  spawnSync("npm", ["view", name, "versions", "--json"], { encoding: "utf8" });

/** Whether the registry holds a real version: false on a 404 or the placeholder alone. */
export function registryKnows(name, view = npmView) {
  const run = view(name);
  let answer;
  try {
    answer = JSON.parse(run.stdout);
  } catch {
    throw new Error(`npm view ${name} gave no JSON answer: ${run.stderr || run.error || "empty"}`);
  }
  if (answer?.error?.code === "E404") return false;
  if (run.status === 0 && (typeof answer === "string" || Array.isArray(answer)))
    return [answer].flat().some((version) => version !== STAGE_PLACEHOLDER);
  throw new Error(`npm view ${name} failed: ${answer?.error?.code ?? "unexpected answer"}`);
}

/** Packs the package with pnpm, which writes the real versions over `workspace:*`, then stages the tarball. */
export function stagePackage({ dir }, tag, token) {
  const out = mkdtempSync(join(tmpdir(), "first-publish-"));
  try {
    const pack = spawnSync("pnpm", ["pack", "--json", "--pack-destination", out], {
      cwd: dir,
      encoding: "utf8",
    });
    if (pack.status !== 0) throw new Error(`pnpm pack failed in ${dir}: ${pack.stderr}`);
    const { filename } = JSON.parse(pack.stdout);
    const stage = spawnSync(
      "npm",
      ["stage", "publish", filename, "--access", "public", "--provenance", "--tag", tag],
      {
        stdio: "inherit",
        env: { ...process.env, "npm_config_//registry.npmjs.org/:_authToken": token },
      },
    );
    if (stage.status !== 0) throw new Error(`npm stage publish failed for ${dir}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/** Reports the packages' state; with a tag, stages the unseen ones. Returns the unseen names. */
export function firstPublish({ packages, knows, stage, tag, token, say = console.log }) {
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
      `${names} ${unseen.length === 1 ? "is a name" : "are names"} npm has never seen and need the stage-only NPM_STAGE_TOKEN secret of the release environment, which is empty.`,
    );
  }
  for (const pkg of unseen) {
    say(`staging ${pkg.name} under ${tag}`);
    stage(pkg, tag, token);
  }
  return unseen.map((pkg) => pkg.name);
}

/** What the run says when it has staged names: nothing is published until each is approved. */
function awaitingApproval(names) {
  return (
    `staged ${names.join(", ")}: nothing is published until each is approved. For each name, ` +
    "`npm stage list <name>` gives its stage id and `npm stage approve <stage-id> --otp <code>` " +
    "publishes it; then re-run this run, which publishes the rest (docs/FIRST-PUBLISH.md)."
  );
}

function selfTest() {
  const packages = [
    { name: "@x/core", dir: "a" },
    { name: "@x/cli", dir: "b" },
    { name: "@x/build", dir: "c" },
  ];
  const known = new Set(["@x/cli"]);
  const run = (over) => {
    const staged = [];
    const said = [];
    const args = {
      packages,
      knows: (name) => known.has(name),
      stage: (pkg, tag, token) => staged.push([pkg.name, tag, token]),
      say: (line) => said.push(line),
      ...over,
    };
    try {
      return { staged, said, result: firstPublish(args) };
    } catch (error) {
      return { staged, said, error };
    }
  };

  const report = run({});
  assert.deepEqual(report.said, ["unseen @x/core", "seen @x/cli", "unseen @x/build"]);

  const noToken = run({ tag: "next", token: "" });
  assert.match(
    noToken.error?.message ?? "",
    /@x\/core, @x\/build .*stage-only NPM_STAGE_TOKEN.*release environment/,
  );
  assert.deepEqual(noToken.staged, []);

  const withToken = run({ tag: "next", token: "t" });
  assert.deepEqual(withToken.staged, [
    ["@x/core", "next", "t"],
    ["@x/build", "next", "t"],
  ]);
  assert.deepEqual(withToken.result, ["@x/core", "@x/build"]);
  assert.match(
    awaitingApproval(withToken.result),
    /staged @x\/core, @x\/build: .*npm stage approve/,
  );

  for (const token of ["", "t"]) {
    const allSeen = run({ tag: "next", token, knows: () => true });
    assert.deepEqual(allSeen.staged, []);
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
  assert.deepEqual(offline.staged, []);

  const answer = (status, body) => () => ({ status, stdout: JSON.stringify(body), stderr: "" });
  assert.equal(registryKnows("@x/a", answer(0, "1.0.0-next.0")), true);
  assert.equal(registryKnows("@x/a", answer(0, [STAGE_PLACEHOLDER, "1.0.0-next.0"])), true);
  assert.equal(registryKnows("@x/a", answer(0, STAGE_PLACEHOLDER)), false);
  assert.equal(registryKnows("@x/a", answer(0, [STAGE_PLACEHOLDER])), false);
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
    "first publish: unseen without a token is red, with one stages only the unseen and says " +
      "what waits for approval, all seen stages nothing, only a 404 or the staging placeholder " +
      "alone is unseen and a network failure is red, a private package is never asked about",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [flag, tag] = process.argv.slice(2);
  if (flag === "--self-test") selfTest();
  else {
    if (flag === "--stage" && !tag) throw new Error("--stage needs an npm tag.");
    try {
      const staging = flag === "--stage";
      const unseen = firstPublish({
        packages: publicPackages(),
        knows: registryKnows,
        stage: stagePackage,
        tag: staging ? tag : undefined,
        token: process.env.NODE_AUTH_TOKEN,
      });
      if (staging && unseen.length > 0) {
        console.error(awaitingApproval(unseen));
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
