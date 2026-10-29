#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Copies the shared CI helpers from a supplied platform checkout and prints their manifest hashes.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CI_REUSE_FILES = [
  "ci-reuse.mjs",
  "workflow-jobs.mjs",
  "ci-merge-proof.mjs",
  "ci-merge-inputs.mjs",
  "ci-pr-proof.mjs",
  "ci-execution-inputs.mjs",
  "ci-execution-inputs-schema.mjs",
  "ci-execution-inputs-filesystem.mjs",
  "ci-execution-inputs-checkout.mjs",
  "ci-execution-inputs-resolver.mjs",
  "ci-job-bootstrap.mjs",
  "ci-main-topology.mjs",
  "ci-witness-slots.mjs",
  "ci-exact-candidate-proof.mjs",
];

export function syncCiReuse(platformRoot, destination) {
  const files = CI_REUSE_FILES.map((name) => [
    name,
    readFileSync(join(platformRoot, "codestyle/ci", name)),
  ]);
  mkdirSync(destination, { recursive: true });
  return Object.fromEntries(
    files.map(([name, bytes]) => {
      const target = join(destination, name);
      writeFileSync(target, bytes);
      assert.deepEqual(readFileSync(target), bytes);
      return [name, createHash("sha256").update(bytes).digest("hex")];
    }),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  if (process.argv.length !== 3)
    throw new Error("Usage: node scripts/sync-ci-reuse.mjs <platform-checkout>");
  console.log(
    JSON.stringify(
      syncCiReuse(process.argv[2], fileURLToPath(new URL("./house/", import.meta.url))),
      null,
      2,
    ),
  );
}
