// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
  },
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@asmjs/renderer-react/client": src("./src/client/index.ts"),
      "@asmjs/renderer-react": src("./src/index.ts"),
      "@asmjs/core/client": src("../core/src/client/index.ts"),
      "@asmjs/core": src("../core/src/index.ts"),
    },
  },
});
