// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { findCiReuse, requiredJobs } from "./ci-reuse.mjs";
import { HOUSE, houseDrift } from "./check-commit-rule.mjs";
import { conditionOf, evaluateCondition, jobsOf } from "./house/workflow-jobs.mjs";
import { CI_REUSE_FILES, syncCiReuse } from "./sync-ci-reuse.mjs";

const repository = "example/assemblejs";
const head = "a".repeat(40);
const merge = "b".repeat(40);
const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const jobs = jobsOf(workflow);

test("full proof names every actual matrix leg and required CI job", () => {
  assert.match(jobs.get("verify"), /name: verify \(\$\{\{ matrix\.node \}\}\)/);
  const versions = jobs
    .get("verify")
    .match(/node: \[([^\]]+)\]/)[1]
    .split(",")
    .map((version) => version.trim());
  const expected = [...jobs]
    .filter(([id]) => id !== "verify")
    .map(([id, body]) => body.match(/^ {4}name: (.+)$/m)?.[1] ?? id);
  expected.push(...versions.map((version) => `verify (${version})`));
  assert.deepEqual([...requiredJobs].sort(), expected.sort());
});

test("actual job predicates skip full PR checks only when proof exists", () => {
  for (const name of ["verify", "browser", "conformance", "examples", "commits"]) {
    const expression = conditionOf(jobs.get(name));
    const verify = (condition) => {
      for (const run_id of ["", "123"]) {
        for (const event_name of ["push", "pull_request"]) {
          const context = {
            needs: { "reuse-ci": { outputs: { run_id } } },
            github: { event_name, event: { pull_request: { user: { login: "contributor" } } } },
          };
          assert.equal(evaluateCondition(condition, context), run_id === "");
          assert.equal(evaluateCondition(condition, context, { success: false }), false);
        }
      }
    };
    verify(expression);
    const mutation = expression.replace("needs['reuse-ci'].outputs.run_id == '' &&", "");
    assert.notEqual(mutation, expression);
    assert.throws(() => verify(mutation), assert.AssertionError);
  }
});

test("PR reuse requires the complete exact-head push and never changes release proof", async () => {
  const event = {
    repository: { full_name: repository },
    pull_request: {
      head: { ref: "next", sha: head, repo: { full_name: repository } },
      base: { repo: { full_name: repository } },
    },
  };
  const run = {
    id: 123,
    head_sha: head,
    event: "push",
    path: ".github/workflows/ci.yml",
    head_branch: "next",
    head_repository: { full_name: repository },
    status: "completed",
    conclusion: "success",
  };
  let missing = "";
  const dependencies = {
    treeOf: async () => "c".repeat(40),
    now: () => 0,
    sleep: async () => {},
    read: async (path) =>
      path.includes("/jobs?")
        ? [
            {
              jobs: requiredJobs
                .filter((name) => name !== missing)
                .map((name) => ({ name, status: "completed", conclusion: "success" })),
            },
          ]
        : [{ workflow_runs: [run] }],
  };
  const options = { repository, eventName: "pull_request", event, mergeSha: merge, waitMs: 0 };
  assert.equal((await findCiReuse(options, dependencies)).run.id, 123);
  for (const name of requiredJobs) {
    missing = name;
    assert.equal((await findCiReuse(options, dependencies)).run, undefined);
  }
  missing = "";
  assert.equal((await findCiReuse({ ...options, eventName: "push" }, dependencies)).run, undefined);
  const release = readFileSync(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  assert.ok(release.includes('--commit "$GITHUB_SHA" --event push'));
  assert.doesNotMatch(release, /scripts\/ci-reuse\.mjs/);
});

test("CI runs the proof contracts and revalidates before accepting reused checks", () => {
  assert.match(jobs.get("reuse-ci"), /timeout-minutes: 120/);
  assert.match(jobs.get("reuse-ci"), /fetch-depth: 0/);
  assert.match(jobs.get("reuse-ci"), /node --test scripts\/ci-reuse\.test\.mjs/);
  assert.match(jobs.get("ci-ready"), /node scripts\/ci-reuse\.mjs --no-wait/);
  assert.match(jobs.get("ci-ready"), /test "\$current" = "\$REUSED_RUN"/);
  assert.doesNotMatch(workflow, /PLATFORM_READ_KEY|repository: ayers-software-repair\/platform/);
});

test("shared copies are covered by the existing manifest and reject edits", () => {
  assert.deepEqual(houseDrift(readFileSync), []);
  assert.deepEqual(
    Object.keys(HOUSE.files).filter(
      (name) => name.startsWith("ci-") || name === "workflow-jobs.mjs",
    ),
    CI_REUSE_FILES,
  );
  for (const name of CI_REUSE_FILES) {
    assert.ok(HOUSE.files[name]);
    assert.equal(
      houseDrift((file) =>
        file.endsWith(name)
          ? Buffer.concat([readFileSync(file), Buffer.from("\n")])
          : readFileSync(file),
      ).length,
      1,
    );
  }
});

test("the sync command reproduces the complete loadable shared module closure", async () => {
  const root = mkdtempSync(join(tmpdir(), "assemblejs-ci-copy-"));
  try {
    const platform = join(root, "platform");
    const destination = join(root, "house");
    mkdirSync(join(platform, "codestyle/ci"), { recursive: true });
    for (const name of CI_REUSE_FILES) {
      writeFileSync(
        join(platform, "codestyle/ci", name),
        readFileSync(new URL(`./house/${name}`, import.meta.url)),
      );
    }
    const hashes = syncCiReuse(platform, destination);
    assert.deepEqual(Object.keys(hashes), CI_REUSE_FILES);
    for (const name of Object.keys(hashes)) {
      const bytes = readFileSync(join(platform, "codestyle/ci", name));
      assert.deepEqual(readFileSync(join(destination, name)), bytes);
      assert.equal(hashes[name], createHash("sha256").update(bytes).digest("hex"));
      assert.equal(hashes[name], HOUSE.files[name]);
      await import(pathToFileURL(join(destination, name)).href);
    }
    for (const missing of [
      "ci-main-topology.mjs",
      "ci-witness-slots.mjs",
      "ci-exact-candidate-proof.mjs",
    ]) {
      const incomplete = join(root, `incomplete-${missing}`);
      syncCiReuse(platform, incomplete);
      rmSync(join(incomplete, missing));
      await assert.rejects(import(pathToFileURL(join(incomplete, "ci-reuse.mjs")).href), {
        code: "ERR_MODULE_NOT_FOUND",
      });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("untrusted, unfinished and mismatched proof always falls back to full CI", async () => {
  const event = {
    repository: { full_name: repository },
    pull_request: {
      head: { ref: "next", sha: head, repo: { full_name: repository } },
      base: { repo: { full_name: repository } },
    },
  };
  const candidate = {
    id: 123,
    head_sha: head,
    event: "push",
    path: ".github/workflows/ci.yml",
    head_branch: "next",
    head_repository: { full_name: repository },
    status: "completed",
    conclusion: "success",
  };
  const options = { repository, eventName: "pull_request", event, mergeSha: merge, waitMs: 0 };
  const proof = async ({
    run = {},
    job = {},
    given = event,
    treesDiffer = false,
    unavailable = false,
  } = {}) =>
    findCiReuse(
      { ...options, event: given },
      {
        treeOf: async (sha) => (treesDiffer && sha === merge ? "d" : "c").repeat(40),
        now: () => 0,
        read: async (path) => {
          if (unavailable) throw new Error("proof API unavailable");
          return path.includes("/jobs?")
            ? [
                {
                  jobs: requiredJobs.map((name) => ({
                    name,
                    status: "completed",
                    conclusion: "success",
                    ...job,
                  })),
                },
              ]
            : [{ workflow_runs: [{ ...candidate, ...run }] }];
        },
      },
    );
  assert.equal((await proof()).run.id, 123);
  for (const run of [
    { conclusion: "failure" },
    { status: "in_progress" },
    { head_sha: "e".repeat(40) },
    { event: "pull_request" },
    { path: ".github/workflows/other.yml" },
    { head_branch: "feature" },
    { head_repository: { full_name: "outside/fork" } },
  ])
    assert.equal((await proof({ run })).run, undefined);
  for (const job of [
    { conclusion: "failure" },
    { conclusion: "skipped" },
    { status: "in_progress" },
  ])
    assert.equal((await proof({ job })).run, undefined);
  for (const part of ["head", "base"]) {
    const given = structuredClone(event);
    given.pull_request[part].repo.full_name = "outside/fork";
    assert.equal((await proof({ given })).run, undefined);
  }
  assert.equal((await proof({ treesDiffer: true })).run, undefined);
  assert.equal((await proof({ unavailable: true })).run, undefined);
});
