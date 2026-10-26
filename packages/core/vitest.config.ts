// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Tests import the package by its published specifier, which is the position a consumer is in,
// and resolve to source rather than to dist so a stale build cannot make a red suite look green.
// What the built artifact exports is a different question, proved by scripts/check-exports.mjs.
export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
    // A page drawn in a test has no server to ask for a stylesheet it links, so the sheet is
    // taken as arrived, as it does on a page a server sent.
    environmentOptions: {
      happyDOM: {
        settings: { disableCSSFileLoading: true, handleDisabledFileLoadingAsSuccess: true },
      },
    },
  },
  resolve: {
    alias: {
      "@asmjs/core/client": src("./src/client/index.ts"),
      "@asmjs/core/outline": src("./src/outline/index.ts"),
      "@asmjs/core": src("./src/index.ts"),
    },
  },
});
