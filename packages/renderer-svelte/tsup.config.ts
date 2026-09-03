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
  splitting: false,
  treeshake: true,
  // React is the consumer's, not ours: a renderer that bundled its framework would ship a
  // second copy of it into every page.
  external: ["svelte", "svelte/server"],
});
