// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { projectFiles, realIo, runPerf } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

// Nested in an example, so the generated project resolves the workspace's packages as an
// installed one would.
const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const root = mkdtempSync(join(example, ".dev-perf-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const capture = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};

describe("the perf verb", { timeout: 60_000 }, () => {
  it("builds, runs the build in production, and weighs each page from it", async () => {
    for (const [path, contents] of Object.entries(projectFiles("weighed"))) {
      realIo.write(join(root, path), contents);
    }
    realIo.write(join(root, "src", "assemblies", "hello", "hello.css"), ".hi { color: red }\n");
    const { io, logs, errors } = capture();
    expect(await runPerf(root, io)).toBe(0);
    expect(errors).toEqual([]);
    const line = logs.find((entry) => entry.startsWith("/  document"));
    expect(line).toMatch(
      /^\/ {2}document \d+ B \(\d+ B gzip\) {2}styles [1-9]\d* B \(\d+ B gzip\) {2}scripts 0 B \(0 B gzip\)$/,
    );
  });

  it("fails, and starts nothing, when the build does", async () => {
    const { io } = capture();
    expect(await runPerf(root, io, async () => 1)).toBe(1);
  });
});
