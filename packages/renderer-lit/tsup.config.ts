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
  splitting: true,
  treeshake: true,
  // Lit is the consumer's, not ours, and its server rendering and hydration are Lit's own
  // packages, so one copy of Lit serves the page.
  external: [/^lit/, /^@lit\//, /^@lit-labs\//],
});
