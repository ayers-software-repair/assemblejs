// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Runs once before the browser suite: builds the packages the tests import from dist, then the
// examples with the real command line. Once, so tests that run in parallel never
// race each other building the same project.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

export default function buildExamples() {
  execFileSync(
    "pnpm",
    [
      "--filter",
      "@assemblejs/core",
      "--filter",
      "@assemblejs/cli",
      "--filter",
      "@assemblejs/renderer-react",
      "--filter",
      "@assemblejs/renderer-svelte",
      "--filter",
      "@assemblejs/renderer-preact",
      "--filter",
      "@assemblejs/renderer-vue",
      "--filter",
      "@assemblejs/renderer-solid",
      "build",
    ],
    { cwd: root, stdio: "pipe" },
  );
  for (const example of ["examples/two-frameworks", "examples/styles", "examples/frameworks"]) {
    execFileSync(process.execPath, ["packages/cli/dist/bin.js", "build", "--cwd", example], {
      cwd: root,
      stdio: "pipe",
    });
  }
}
