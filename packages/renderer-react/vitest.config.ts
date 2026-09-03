// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@assemblejs/renderer-react/client": src("./src/client/index.ts"),
      "@assemblejs/renderer-react": src("./src/index.ts"),
      "@assemblejs/core/client": src("../core/src/client/index.ts"),
      "@assemblejs/core/renderer": src("../core/src/renderer/index.ts"),
      "@assemblejs/core": src("../core/src/index.ts"),
    },
  },
});
