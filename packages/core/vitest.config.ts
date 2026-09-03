// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Tests import the package by its published specifier, which is the position a consumer is in,
// and resolve to source rather than to dist so a stale build cannot make a red suite look green.
// What the built artifact exports is a different question, proved by scripts/check-exports.mjs.
export default defineConfig({
  resolve: {
    alias: {
      "@assemblejs/core/renderer": src("./src/renderer/index.ts"),
      "@assemblejs/core/client": src("./src/client/index.ts"),
      "@assemblejs/core": src("./src/index.ts"),
    },
  },
});
