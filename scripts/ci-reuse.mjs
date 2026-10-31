#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { findPullRequestReuse } from "./house/ci-reuse.mjs";

export const requiredJobs = [
  "reuse-ci",
  "verify (22)",
  "verify (24)",
  "browser proof",
  "conformance",
  "examples",
  "commits",
  "ci-ready",
];

/** Only PR checks reuse proof; release eligibility still requires exact-commit push CI. */
export function findCiReuse(options, dependencies) {
  return findPullRequestReuse({ ...options, requiredJobs }, dependencies);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const result = await findCiReuse({
      repository: process.env.GITHUB_REPOSITORY,
      eventName: process.env.GITHUB_EVENT_NAME,
      event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
      mergeSha: process.env.GITHUB_SHA,
      waitMs: process.argv.includes("--no-wait") ? 0 : undefined,
    });
    if (result.run) console.log(result.run.id);
    else console.error(result.reason);
  } catch {
    console.error("PR proof unavailable; run full CI");
  }
}
