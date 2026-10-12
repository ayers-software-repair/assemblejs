// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";
import { uncompiled } from "@assemblejs/build";

describe("what the compiler said of a source it could not compile", () => {
  it("is each thing it said, with the line it said it of", () => {
    let thrown: unknown;
    try {
      transformSync("export default (\n  <p>a</b>\n);", { loader: "tsx" });
    } catch (error) {
      thrown = error;
    }
    const said = uncompiled(thrown) ?? [];
    expect(said.length).toBeGreaterThan(0);
    expect(said[0]?.text).toMatch(/\S/);
    expect(said[0]?.line).toBe(2);
  });

  it("is nothing for a throw that is not the compiler's", () => {
    expect(uncompiled(new Error("no such file"))).toBeUndefined();
    expect(uncompiled({ errors: "not a list" })).toBeUndefined();
    expect(uncompiled(undefined)).toBeUndefined();
  });

  it("reads a refusal with no place in the source as one with no line", () => {
    expect(uncompiled({ errors: [{ text: "out of memory", location: null }] })).toEqual([
      { text: "out of memory", line: undefined },
    ]);
  });
});
