// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vitest/config";
import { compileSolid } from "./src/compiler/compile-solid.js";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Test components compile as a project's would: types stripped and decorators lowered, then
// Solid's own preset, for the side the test runs on.
const solid = (side: "client" | "server"): Plugin => ({
  name: "solid",
  enforce: "pre",
  async transform(code, id) {
    if (!id.endsWith(".tsx")) return undefined;
    const stripped = await transform(code, { loader: "tsx", jsx: "preserve", target: "es2022" });
    return compileSolid(stripped.code, { filename: id, side });
  },
});

const alias = {
  "@assemblejs/renderer-solid/client": src("./src/client/index.ts"),
  "@assemblejs/renderer-solid/compiler": src("./src/compiler/index.ts"),
  "@assemblejs/renderer-solid": src("./src/index.ts"),
  "@assemblejs/core/client": src("../core/src/client/index.ts"),
  "@assemblejs/core/renderer": src("../core/src/renderer/index.ts"),
  "@assemblejs/core": src("../core/src/index.ts"),
};

// Two projects, because Solid is two builds: its server build renders strings, its browser
// build hydrates, and each test must run against the one its side really gets.
export default defineConfig({
  test: {
    globalSetup: ["../../scripts/build-when-stale.mjs", "../../scripts/test-temp-root.mjs"],
    projects: [
      {
        plugins: [solid("server")],
        resolve: { alias },
        test: { name: "server", include: ["test/{server,compiler,props}/**/*.test.{ts,tsx}"] },
      },
      {
        plugins: [solid("client")],
        resolve: { alias, conditions: ["browser"] },
        test: {
          name: "client",
          include: ["test/client/**/*.test.{ts,tsx}"],
          environment: "happy-dom",
          server: { deps: { inline: [/solid-js/] } },
        },
      },
    ],
  },
});
