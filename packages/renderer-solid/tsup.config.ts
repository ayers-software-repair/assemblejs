// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client/index.ts", "src/compiler/index.ts"],
  format: ["esm"],
  target: "node22",
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: false,
  clean: true,
  // Split, so the events context both entry points use is one module: the server render provides
  // it and a component reads it through the browser entry's function, and two copies would be
  // two contexts that never meet.
  splitting: true,
  treeshake: true,
  // Solid is the consumer's, not ours, and resolves to its server or browser build by where it
  // runs; the compiler's Babel stays a dependency loaded only when a build compiles.
  external: ["solid-js", "solid-js/web", "@babel/core", "babel-preset-solid"],
});
