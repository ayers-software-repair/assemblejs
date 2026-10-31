#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
/* global process, console, setTimeout */
// Reuses full push checks for a same-tree pull request. Its verdict is only a PR optimization;
// release gates must independently require push proof for their exact source commit.
import { execFile } from "node:child_process";
import { findMergeProof } from "./ci-merge-proof.mjs";
export { createPullRequestProof } from "./ci-pr-proof.mjs";
export { findExactCandidateProof } from "./ci-exact-candidate-proof.mjs";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const SHA = /^[a-f0-9]{40}$/;

/** Every required check must run; only failure-cancellation jobs may be skipped. */
export function fullPushFailures(jobs, requiredJobs) {
  if (
    !Array.isArray(requiredJobs) ||
    !requiredJobs.length ||
    requiredJobs.some((name) => typeof name !== "string" || !name)
  ) {
    throw new Error("Full push proof requires named checks");
  }
  const failures = requiredJobs
    .filter((name) => !jobs.some((job) => job.name === name))
    .map((name) => `${name} (missing)`);
  for (const job of jobs) {
    if (job.status !== "completed") failures.push(`${job.name} (${job.status})`);
    else if (
      job.conclusion !== "success" &&
      !(job.name.startsWith("stop-after-") && job.conclusion === "skipped" && !requiredJobs.includes(job.name))
    ) {
      failures.push(`${job.name} (${job.conclusion})`);
    }
  }
  return failures;
}

async function readApi(path) {
  const { stdout } = await exec("gh", ["api", path, "--paginate", "--slurp"], {
    timeout: 20_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

async function treeOf(sha) {
  const { stdout } = await exec("git", ["rev-parse", "--verify", `${sha}^{tree}`], { timeout: 10_000 });
  return stdout.trim();
}

/** Missing, failed, changed or unavailable proof falls back to full PR CI. */
export async function findPullRequestReuse(
  { repository, eventName, event, mergeSha, requiredJobs, workflow = "ci.yml", waitMs = 110 * 60_000, pollMs = 30_000 },
  dependencies = {},
) {
  const branch = "next";
  const read = dependencies.read ?? readApi;
  const tree = dependencies.treeOf ?? treeOf;
  const now = dependencies.now ?? Date.now;
  const sleep = dependencies.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  try {
    const pr = event?.pull_request;
    if (
      eventName !== "pull_request" ||
      !/^[\w.-]+\/[\w.-]+$/.test(repository ?? "") ||
      event?.repository?.full_name !== repository ||
      pr?.head?.repo?.full_name !== repository ||
      pr?.base?.repo?.full_name !== repository ||
      pr?.head?.ref !== branch
    ) {
      return { reason: "PR is not from the eligible branch in this repository" };
    }
    if (
      !SHA.test(mergeSha ?? "") ||
      !SHA.test(pr.head.sha ?? "") ||
      !/^[\w.-]+\.yml$/.test(workflow) ||
      !Number.isInteger(waitMs) ||
      waitMs < 0 ||
      waitMs > 110 * 60_000 ||
      !Number.isInteger(pollMs) ||
      pollMs < 1000 ||
      pollMs > 30_000
    ) {
      return { reason: "Invalid PR proof inputs" };
    }
    fullPushFailures([], requiredJobs);
    const [mergeTree, headTree] = await Promise.all([tree(mergeSha), tree(pr.head.sha)]);
    if (!SHA.test(mergeTree ?? "") || mergeTree !== headTree) return { reason: "PR merge and head trees differ" };
    const deadline = now() + waitMs;
    for (;;) {
      const pages = await read(
        `repos/${repository}/actions/workflows/${workflow}/runs?head_sha=${pr.head.sha}&event=push&per_page=100`,
      );
      const runs = pages
        .flatMap((page) => page.workflow_runs)
        .filter(
          (run) =>
            run.head_sha === pr.head.sha &&
            run.event === "push" &&
            run.head_branch === branch &&
            run.path === `.github/workflows/${workflow}` &&
            run.head_repository?.full_name === repository,
        );
      const run = runs.sort((a, b) => b.id - a.id)[0];
      if (run?.status === "completed") {
        if (run.conclusion !== "success") return { reason: `Push CI ${run.id} finished ${run.conclusion}` };
        const jobs = (await read(`repos/${repository}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`)).flatMap(
          (page) => page.jobs,
        );
        const failures = fullPushFailures(jobs, requiredJobs);
        return failures.length
          ? { reason: `Push CI ${run.id}: ${failures.join(", ")}` }
          : { run, sourceSha: pr.head.sha, kind: "pull-request-reuse" };
      }
      const remaining = deadline - now();
      if (remaining <= 0) return { reason: "Exact-head push proof is not complete within the wait limit" };
      await sleep(Math.min(pollMs, remaining));
    }
  } catch (error) {
    return { reason: `PR proof unavailable; run full CI (${error.message})` };
  }
}

/** Native PR/main evidence under a reviewed mapping gates reuse; absent proof runs full CI. */
export function findMergedPullRequestReuse(options, dependencies = {}) {
  return findMergeProof(options, { read: readApi, fullFailures: fullPushFailures, ...dependencies });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await findPullRequestReuse({
      repository: process.env.GITHUB_REPOSITORY,
      eventName: process.env.GITHUB_EVENT_NAME,
      event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
      mergeSha: process.env.GITHUB_SHA,
      requiredJobs: JSON.parse(process.env.CI_REQUIRED_JOBS ?? "[]"),
    });
    if (result.run) console.log(result.run.id);
    else console.error(result.reason);
  } catch {
    console.error("PR proof unavailable; run full CI");
  }
}
