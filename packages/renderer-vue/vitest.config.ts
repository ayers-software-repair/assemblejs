// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const alias = {
  "@assemblejs/renderer-vue/client": src("./src/client/index.ts"),
  "@assemblejs/renderer-vue": src("./src/index.ts"),
  "@assemblejs/core/client": src("../core/src/client/index.ts"),
  "@assemblejs/core/renderer": src("../core/src/renderer/index.ts"),
  "@assemblejs/core": src("../core/src/index.ts"),
};

// The server tests run against both of Vue's builds: its development build throws where its
// production build only reports, and a server in production runs the second.
export default defineConfig({
  test: {
    projects: [
      { resolve: { alias }, test: { name: "development" } },
      {
        resolve: { alias },
        test: {
          name: "production",
          include: ["test/server/**/*.test.ts"],
          env: { NODE_ENV: "production" },
        },
      },
    ],
  },
});
