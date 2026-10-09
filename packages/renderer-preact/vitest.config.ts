// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: { globalSetup: ["../../scripts/test-temp-root.mjs"] },
  esbuild: { jsx: "automatic", jsxImportSource: "preact" },
  resolve: {
    alias: {
      "@assemblejs/renderer-preact/client": src("./src/client/index.ts"),
      "@assemblejs/renderer-preact": src("./src/index.ts"),
      "@assemblejs/core/client": src("../core/src/client/index.ts"),
      "@assemblejs/core/renderer": src("../core/src/renderer/index.ts"),
      "@assemblejs/core": src("../core/src/index.ts"),
    },
  },
});
