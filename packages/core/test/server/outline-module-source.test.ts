// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { outlineModuleSource } from "@asmjs/core";

describe("the module that draws an outline, as a server serves it", () => {
  it("is the package's own build for a browser: one file that exports the function and imports nothing", () => {
    const source = outlineModuleSource();
    expect(source).toMatch(/export \{[^}]*\boutline\b[^}]*\};?\s*$/);
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toContain("node:");
  });
});
