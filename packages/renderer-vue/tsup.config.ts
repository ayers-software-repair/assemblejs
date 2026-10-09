// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client/index.ts"],
  format: ["esm"],
  target: "node22",
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: false,
  clean: true,
  // Split, so the injection key both entry points use is one module: the server render provides
  // it and a component injects it through the browser entry's function, and two copies would be
  // two keys that never meet.
  splitting: true,
  treeshake: true,
  // Vue is the consumer's, not ours: a renderer that bundled its framework would ship a second
  // copy of it into every page.
  external: ["vue", "vue/server-renderer"],
});
