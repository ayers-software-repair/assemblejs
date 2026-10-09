// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const alias = {
  "@assemblejs/renderer-lit/client": src("./src/client/index.ts"),
  "@assemblejs/renderer-lit": src("./src/index.ts"),
  "@assemblejs/core/client": src("../core/src/client/index.ts"),
  "@assemblejs/core/renderer": src("../core/src/renderer/index.ts"),
  "@assemblejs/core": src("../core/src/index.ts"),
};

// Two projects, because Lit is two builds: its node build renders on the server, its browser
// build hydrates, and each test must run against the one its side really gets.
export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
    projects: [
      {
        resolve: { alias },
        test: { name: "server", include: ["test/{server,props}/**/*.test.ts"] },
      },
      {
        resolve: { alias, conditions: ["browser"] },
        test: {
          name: "client",
          include: ["test/client/**/*.test.ts"],
          environment: "happy-dom",
          server: { deps: { inline: [/lit/] } },
        },
      },
    ],
  },
});
