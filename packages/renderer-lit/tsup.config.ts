// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "tsup";

export default defineConfig({
  // The hydration support is an entry of its own, so a build can load it before anything else.
  entry: ["src/index.ts", "src/client/index.ts", "src/client/hydration-support.ts"],
  format: ["esm"],
  target: "node22",
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: false,
  clean: true,
  splitting: true,
  treeshake: true,
  // Lit is the consumer's, not ours, and its server rendering and hydration are Lit's own
  // packages, so one copy of Lit serves the page.
  external: [/^lit/, /^@lit\//, /^@lit-labs\//],
});
