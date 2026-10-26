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
      "@asmjs/core",
      "--filter",
      "@asmjs/build",
      "--filter",
      "@asmjs/check",
      "--filter",
      "@asmjs/cli",
      "--filter",
      "@asmjs/renderer-react",
      "--filter",
      "@asmjs/renderer-svelte",
      "--filter",
      "@asmjs/renderer-preact",
      "--filter",
      "@asmjs/renderer-vue",
      "--filter",
      "@asmjs/renderer-solid",
      "--filter",
      "@asmjs/renderer-lit",
      "--filter",
      "@asmjs/renderer-templates",
      "--filter",
      "@asmjs/devtools",
      "build",
    ],
    { cwd: root, stdio: "pipe" },
  );
  for (const example of [
    "examples/two-frameworks",
    "examples/styles",
    "examples/frameworks",
    "examples/shadow",
    "examples/realtime",
    // The showcase: four servers, each a project of its own.
    "examples/market/catalog",
    "examples/market/reviews",
    "examples/market/fulfilment",
    "examples/market/shop",
  ]) {
    execFileSync(process.execPath, ["packages/cli/dist/bin.js", "build", "--cwd", example], {
      cwd: root,
      stdio: "pipe",
    });
  }
}
