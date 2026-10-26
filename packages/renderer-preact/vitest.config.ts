// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
  },
  esbuild: { jsx: "automatic", jsxImportSource: "preact" },
  resolve: {
    alias: {
      "@asmjs/renderer-preact/client": src("./src/client/index.ts"),
      "@asmjs/renderer-preact": src("./src/index.ts"),
      "@asmjs/core/client": src("../core/src/client/index.ts"),
      "@asmjs/core": src("../core/src/index.ts"),
    },
  },
});
