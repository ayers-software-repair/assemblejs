// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@assemblejs/mcp": src("./src/index.ts"),
      "@assemblejs/cli": src("../cli/src/index.ts"),
      "@assemblejs/core": src("../core/src/index.ts"),
    },
  },
});
