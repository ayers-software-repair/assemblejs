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
  // Split, so the events context both entry points use is one module: the server render provides
  // it and a component reads it through the browser entry's hook, and two copies would be two
  // contexts that never meet.
  splitting: true,
  treeshake: true,
  // Preact is the consumer's, not ours: a renderer that bundled its framework would ship a
  // second copy of it into every page, and two copies of Preact share no hooks.
  external: ["preact", "preact/hooks", "preact-render-to-string"],
});
