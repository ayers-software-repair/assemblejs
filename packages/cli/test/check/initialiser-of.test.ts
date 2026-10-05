// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";
import { describe, expect, it } from "vitest";
import { initialiserOf } from "@assemblejs/cli";

const program = (source: string) => parse(source, { ecmaVersion: "latest", sourceType: "module" });

describe("what a module declares a name as", () => {
  it("is the initialiser of a top-level declaration, and nothing for a name declared otherwise", () => {
    const found = initialiserOf(
      program('const a = 1; let b; function c() {}\nconst d = "x";'),
      "d",
    );
    expect(found?.type).toBe("Literal");
    expect(initialiserOf(program("let b;"), "b")).toBeUndefined();
    expect(initialiserOf(program("function c() {}"), "c")).toBeUndefined();
    expect(initialiserOf(program("{ const inner = 1; }"), "inner")).toBeUndefined();
  });
});
