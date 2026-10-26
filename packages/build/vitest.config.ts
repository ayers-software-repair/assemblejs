// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Tests import the package by its published specifier, which is the position a consumer is in,
// and resolve to source rather than to dist so a stale build cannot make a red suite look green.
export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
    // The bundling tests build real browser bundles; a cold esbuild on a loaded machine outruns
    // vitest's five-second default, which read as five timeouts with nothing wrong.
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@asmjs/build": src("./src/index.ts"),
      "@asmjs/core": src("../core/src/index.ts"),
    },
  },
});
