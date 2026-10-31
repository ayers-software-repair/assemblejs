// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { transform } from "esbuild";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Unit tests use source without requiring the framework build's generated TypeScript projects.
  oxc: false,
  plugins: [
    {
      name: "market-unit-source",
      enforce: "pre",
      transform: async (code, id) => {
        if (!/\.tsx?$/.test(id) || id.includes("/node_modules/")) return;
        return transform(code, {
          loader: id.endsWith(".tsx") ? "tsx" : "ts",
          jsx: "automatic",
          format: "esm",
          target: "es2022",
          tsconfigRaw: "{}",
          sourcemap: "inline",
          sourcefile: id,
        });
      },
    },
  ],
  test: {
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    environment: "happy-dom",
    maxWorkers: 1,
  },
});
