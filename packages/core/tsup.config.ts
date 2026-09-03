// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "tsup";

// No sourcemaps: the pack gate refuses a tarball carrying them, and a published map without
// its sources is a file nobody can use.
export default defineConfig({
  entry: ["src/index.ts", "src/renderer/index.ts", "src/client/index.ts"],
  format: ["esm"],
  target: "node22",
  // tsup's declaration pass sets baseUrl itself, which TypeScript 6 deprecates; the option
  // acknowledges the deprecation rather than turning the whole pass off.
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: false,
  clean: true,
  splitting: false,
  treeshake: true,
});
