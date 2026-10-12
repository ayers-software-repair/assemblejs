// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { importOf } from "@assemblejs/build";

const from = "/p/.assemblejs";
// The compiler passes over the import, and a linter over the comment that says so.
const PASSED_OVER =
  "// eslint-disable-next-line\n// @ts-ignore: not TypeScript, and read by the build\n";

describe("the line a generated module imports a file with", () => {
  it("names a TypeScript source by the .js the bundler resolves it from, under the clause given", () => {
    expect(importOf("view_hi", from, "/p/src/assemblies/hi/hi.react.tsx")).toBe(
      'import view_hi from "../src/assemblies/hi/hi.react.js";',
    );
    expect(importOf("* as view_meter", from, "/p/src/assemblies/meter/meter.lit.ts")).toBe(
      'import * as view_meter from "../src/assemblies/meter/meter.lit.js";',
    );
    expect(importOf("api_time", from, "/p/src/api/time.api.mts")).not.toContain("@ts-ignore");
  });

  // The compiler has no declaration for any of them, and the bundler reads every one.
  it("has the compiler pass over a file that is not TypeScript", () => {
    for (const file of [
      "a.html",
      "a.svelte",
      "a.vue",
      "a.ejs",
      "a.hbs",
      "a.md",
      "a.njk",
      "a.pug",
    ]) {
      expect(importOf("view", from, `/p/src/assemblies/a/${file}`), file).toBe(
        `${PASSED_OVER}import view from "../src/assemblies/a/${file}";`,
      );
    }
  });
});
