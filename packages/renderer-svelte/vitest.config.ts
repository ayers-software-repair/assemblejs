// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// The real Svelte compiler, so the tests exercise a .svelte file the way a user's build would
// rather than a hand-written approximation of its output.
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // Svelte ships a server build and a browser build behind export conditions. Without this,
    // the client tests resolve to the server build, whose hydrate has no DOM operations
    // initialised and fails deep inside svelte with an undefined getter. The server render is
    // unaffected because it imports svelte/server, which is its own export path.
    conditions: ["browser"],
    alias: {
      "@assemblejs/renderer-svelte/client": src("./src/client/index.ts"),
      "@assemblejs/renderer-svelte": src("./src/index.ts"),
      "@assemblejs/core/client": src("../core/src/client/index.ts"),
      "@assemblejs/core/renderer": src("../core/src/renderer/index.ts"),
      "@assemblejs/core": src("../core/src/index.ts"),
    },
  },
});
