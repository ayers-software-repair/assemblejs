// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { test } from "node:test";
import { checkDistTags, tagPolicy } from "./check-dist-tags.mjs";

const old = "1.0.0-next.2";
const newest = "1.0.0-next.10";
const versions = [newest, "0.0.0-stage", old];
const good = { versions, tags: { latest: newest, next: newest } };
const behind = { versions, tags: { latest: old, next: newest } };
const packages = [{ name: "@x/core", version: newest }];
const command =
  "npm dist-tag add @x/core@1.0.0-next.10 latest --registry=https://registry.npmjs.org";

function fixture(metadata = good, options = {}) {
  const calls = [];
  let reads = 0;
  const run = (args) => {
    calls.push(args);
    if (args[0] === "--version") return { status: 0, stdout: options.npm ?? "11.21.0" };
    if (args[0] === "dist-tag") {
      if (options.denied) return { status: 1, stderr: "SECRET REMOTE BODY" };
      if (!options.noEffect) metadata = good;
      return { status: 0, stdout: "ignored" };
    }
    reads++;
    if (options.unavailable) return options.unavailable;
    if (options.beforeStable && reads > 2) {
      metadata = { versions: [...versions, "1.0.0"], tags: { next: newest, latest: "1.0.0" } };
    }
    return {
      status: 0,
      stdout: JSON.stringify(args[2] === "versions" ? metadata.versions : metadata.tags),
    };
  };
  const check = (repair = false, list = packages) =>
    checkDistTags({ packages: list, run, repair, say() {} });
  return { calls, check };
}

test("prerelease parity uses numerical next precedence; placeholder is not stable", () => {
  assert.deepEqual(tagPolicy(good).expected, { latest: newest, next: newest });
  assert.equal(tagPolicy(good).stable, undefined);
  assert.equal(tagPolicy(behind).problems[0].version, newest);
  assert.equal(
    tagPolicy({ versions: ["0.9.0", "0.10.0", ...versions], tags: {} }).expected.latest,
    "0.10.0",
  );
});

test("stable precedence includes pre-1.0 stable and never promotes a prerelease", () => {
  const data = { versions: ["1.9.0", "1.10.0", "2.0.0-next.1"], tags: {} };
  assert.deepEqual(tagPolicy(data).expected, { latest: "1.10.0", next: "2.0.0-next.1" });
  assert.deepEqual(tagPolicy({ versions: ["1.0.0"], tags: { latest: "1.0.0" } }).problems, []);
});

test("malformed/missing registry data fails closed", () => {
  for (const data of [
    null,
    {},
    { tags: [], versions },
    { tags: {}, versions: [] },
    { tags: {}, versions: [null] },
    { tags: { latest: "missing" }, versions },
    { tags: {}, versions: ["0.0.0-stage"] },
  ])
    assert.throws(() => tagPolicy(data));
});

test("read-only succeeds only on correct tags and never issues a write", () => {
  const f = fixture();
  f.check();
  assert.deepEqual(
    f.calls.map((args) => args.slice(0, 3)),
    [
      ["view", "@x/core", "dist-tags"],
      ["view", "@x/core", "versions"],
    ],
  );
  const bad = fixture(behind);
  assert.throws(
    () => bad.check(),
    (error) => error.message.includes(command),
  );
  assert.equal(
    bad.calls.some((args) => args[0] === "dist-tag"),
    false,
  );
});

test("release repair reads before/after, moves latest only and verifies success", () => {
  const f = fixture(behind);
  f.check(true);
  assert.equal(f.calls.filter((args) => args[0] === "view").length, 6);
  assert.deepEqual(
    f.calls.find((args) => args[0] === "dist-tag"),
    ["dist-tag", "add", "@x/core@1.0.0-next.10", "latest", "--registry=https://registry.npmjs.org"],
  );
});

test("OIDC denial fails with exact operator command without raw response or retry", () => {
  const f = fixture(behind, { denied: true });
  assert.throws(
    () => f.check(true),
    (e) => e.message.includes(command) && !e.message.includes("SECRET"),
  );
  assert.equal(f.calls.filter((args) => args[0] === "dist-tag").length, 1);
});

test("successful mutation without matching readback is still red", () => {
  assert.throws(
    () => fixture(behind, { noEffect: true }).check(true),
    /repair readback failed; operator: npm dist-tag add/,
  );
});

test("unsupported/failed npm version never attempts a tag mutation", () => {
  for (const npm of ["10.9.0", "11.20.9", "12.1.9", "not a version"]) {
    const f = fixture(behind, { npm });
    assert.throws(() => f.check(true), /OIDC dist-tags need/);
    assert.equal(
      f.calls.some((args) => args[0] === "dist-tag"),
      false,
    );
  }
  fixture(behind, { npm: "12.2.0" }).check(true);
});

test("stable latest mismatch is never automatically repaired", () => {
  const f = fixture({ versions: [...versions, "1.0.0"], tags: { latest: newest, next: newest } });
  assert.throws(() => f.check(true), /latest must be 1.0.0/);
  assert.equal(
    f.calls.some((args) => args[0] === "dist-tag"),
    false,
  );
});

test("new stable publication between reads prevents repair", () => {
  const f = fixture(behind, { beforeStable: true });
  assert.throws(() => f.check(true), /registry changed before repair/);
  assert.equal(
    f.calls.some((args) => args[0] === "dist-tag"),
    false,
  );
});

test("wrong next tag and unpublished release version cannot authorize repair", () => {
  const f = fixture({ versions, tags: { next: old, latest: old } });
  assert.throws(() => f.check(true), /next must be/);
  assert.equal(
    f.calls.some((args) => args[0] === "dist-tag"),
    false,
  );
  const g = fixture(behind);
  assert.throws(
    () => g.check(true, [{ ...packages[0], version: "1.0.0-next.99" }]),
    /not published/,
  );
  assert.equal(
    g.calls.some((args) => args[0] === "dist-tag"),
    false,
  );
});

test("E404, outage, bad JSON and oversized/timeout-style failures are not empty registries", () => {
  for (const unavailable of [
    { status: 1, stdout: '{"error":{"code":"E404"}}' },
    { status: 1, stdout: '{"error":{"code":"E500"}}' },
    { status: 0, stdout: "<html>SECRET</html>" },
    { status: null, stdout: "", error: new Error("SECRET") },
  ]) {
    const f = fixture(good, { unavailable });
    assert.throws(
      () => f.check(true),
      (e) => /npm view/.test(e.message) && !e.message.includes("SECRET"),
    );
    assert.equal(
      f.calls.some((args) => args[0] === "dist-tag"),
      false,
    );
  }
});

test("all public packages are checked even after a failure", () => {
  const f = fixture(behind);
  assert.throws(
    () => f.check(false, [...packages, { name: "@x/cli", version: newest }]),
    /@x\/cli/,
  );
  assert.equal(f.calls.filter((args) => args[0] === "view").length, 4);
  assert.throws(() => f.check(false, []), /no public packages/);
});

test("real CLI is read-only, excludes private packages and propagates failing status", () => {
  const root = mkdtempSync(join(tmpdir(), "dist-tags-fixture-"));
  const script = resolve("scripts/check-dist-tags.mjs");
  try {
    mkdirSync(join(root, "bin"));
    for (const [dir, pkg] of [
      ["core", packages[0]],
      ["private", { name: "private", private: true }],
    ]) {
      mkdirSync(join(root, "packages", dir), { recursive: true });
      writeFileSync(join(root, "packages", dir, "package.json"), JSON.stringify(pkg));
    }
    const npm = join(root, "bin", "npm");
    writeFileSync(
      npm,
      `#!${process.execPath}\n` +
        `const fs=require('node:fs'); const args=process.argv.slice(2);\n` +
        `fs.appendFileSync('calls.jsonl',JSON.stringify(args)+'\\n');\n` +
        `if(args[0]!=='view')process.exit(9);\n` +
        `const data=JSON.parse(fs.readFileSync('registry.json','utf8'));\n` +
        `process.stdout.write(JSON.stringify(args[2]==='versions'?data.versions:data.tags));\n`,
    );
    chmodSync(npm, 0o755);
    const invoke = (args = []) =>
      spawnSync(process.execPath, [script, ...args], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${join(root, "bin")}${delimiter}${process.env.PATH}`,
          GITHUB_ACTIONS: "false",
        },
      });
    writeFileSync(join(root, "registry.json"), JSON.stringify(good));
    assert.equal(invoke().status, 0);
    writeFileSync(join(root, "registry.json"), JSON.stringify(behind));
    const failed = invoke();
    assert.equal(failed.status, 1);
    assert.ok(failed.stderr.includes(command));
    assert.equal(invoke(["--repair-prerelease"]).status, 1);
    const calls = readFileSync(join(root, "calls.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.equal(calls.length, 4);
    assert.ok(calls.every((args) => args[0] === "view" && args[1] === "@x/core"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("stable build metadata prevents prerelease promotion and automatic mutation", () => {
  const data = {
    versions: ["1.0.0+build.1", "2.0.0-next.1"],
    tags: { latest: "2.0.0-next.1", next: "2.0.0-next.1" },
  };
  assert.equal(tagPolicy(data).expected.latest, "1.0.0+build.1");
  const f = fixture(data);
  assert.throws(
    () => f.check(true, [{ ...packages[0], version: "2.0.0-next.1" }]),
    /latest must be/,
  );
  assert.equal(
    f.calls.some((args) => args[0] === "dist-tag"),
    false,
  );
});

test("build identifiers do not change precedence or order equal-highest releases", () => {
  const data = {
    versions: ["1.0.0+a", "1.0.0+z", "2.0.0-next.2+x", "2.0.0-next.10+z", "2.0.0-next.10+a"],
    tags: { latest: "1.0.0+z", next: "2.0.0-next.10+a" },
  };
  assert.deepEqual(tagPolicy(data).problems, []);
  assert.deepEqual(tagPolicy({ ...data, versions: [...data.versions].reverse() }).problems, []);
});
