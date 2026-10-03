// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: false,
  clean: true,
  splitting: false,
  treeshake: true,
  // The engines stay the project's install, each imported when its first template renders.
  external: ["ejs", "handlebars", "markdown-it", "nunjucks", "pug"],
});
