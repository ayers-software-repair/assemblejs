// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
  },
  resolve: {
    alias: {
      "@asmjs/mcp": src("./src/index.ts"),
      "@asmjs/build": src("../build/src/index.ts"),
      "@asmjs/check": src("../check/src/index.ts"),
      "@asmjs/cli": src("../cli/src/index.ts"),
      "@asmjs/core": src("../core/src/index.ts"),
    },
  },
});
