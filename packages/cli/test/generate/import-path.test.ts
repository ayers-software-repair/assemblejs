// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { importPath } from "@assemblejs/cli";

describe("the specifier a generated module imports a file by", () => {
  it("is relative to the generated module, with forward slashes", () => {
    expect(importPath("/p/.assemblejs", "/p/src/pages/home/home.html")).toBe(
      "../src/pages/home/home.html",
    );
    expect(importPath("/p/.assemblejs", "/p/.assemblejs/client/a.ts")).toBe("./client/a.js");
  });

  it("names a TypeScript source by the .js the bundler resolves it from", () => {
    expect(importPath("/p/.assemblejs", "/p/src/a/a.react.tsx")).toBe("../src/a/a.react.js");
    expect(importPath("/p/.assemblejs", "/p/src/a/a.svelte")).toBe("../src/a/a.svelte");
  });
});
