// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";

function releaseChannel(ref, versions, pre) {
  const match =
    /^refs\/tags\/v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(-next\.(?:0|[1-9]\d*))?)$/.exec(
      ref,
    );
  if (!match) throw new Error("Release from a vX.Y.Z or vX.Y.Z-next.N tag.");
  const version = match[1];
  if (versions.length === 0 || versions.some((value) => value !== version)) {
    throw new Error("Every public package must have the version named by the release tag.");
  }
  const next = match[2] !== undefined;
  if (next ? pre?.mode !== "pre" || pre.tag !== "next" : pre?.mode === "pre") {
    throw new Error("The release tag and Changesets prerelease mode disagree.");
  }
  return { version, branch: next ? "next" : "main", npmTag: next ? "next" : "latest" };
}

if (process.argv[2] === "--self-test") {
  const pre = { mode: "pre", tag: "next" };
  assert.deepEqual(releaseChannel("refs/tags/v1.0.0-next.3", ["1.0.0-next.3"], pre), {
    version: "1.0.0-next.3",
    branch: "next",
    npmTag: "next",
  });
  assert.deepEqual(releaseChannel("refs/tags/v1.0.0", ["1.0.0", "1.0.0"], null), {
    version: "1.0.0",
    branch: "main",
    npmTag: "latest",
  });
  for (const args of [
    ["refs/heads/main", ["1.0.0"], null],
    ["refs/tags/v1.0.0-rc.1", ["1.0.0-rc.1"], null],
    ["refs/tags/v01.0.0", ["01.0.0"], null],
    ["refs/tags/v1.0.0", [], null],
    ["refs/tags/v1.0.0", ["1.0.0", "1.0.0-next.0"], null],
    ["refs/tags/v1.0.0", ["1.0.0"], pre],
    ["refs/tags/v1.0.0-next.0", ["1.0.0-next.0"], null],
  ])
    assert.throws(() => releaseChannel(...args));
  console.log("release channel: stable and next pass; seven invalid release inputs rejected");
} else {
  const packages = readdirSync("packages", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => JSON.parse(readFileSync(`packages/${entry.name}/package.json`, "utf8")))
    .filter((item) => !item.private);
  const pre = existsSync(".changeset/pre.json")
    ? JSON.parse(readFileSync(".changeset/pre.json", "utf8"))
    : null;
  const channel = releaseChannel(
    process.env.GITHUB_REF || "",
    packages.map((item) => item.version),
    pre,
  );
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${channel.version}\nbranch=${channel.branch}\nnpm-tag=${channel.npmTag}\n`,
    );
  }
  console.log(JSON.stringify(channel));
}
