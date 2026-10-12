// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { viewRefusal } from "@assemblejs/cli";

const SOURCE = "<h1>shop</h1>\r\n<p>{</p>\r\n";
const refused = (error: unknown) => viewRefusal(error, "/shop/src/a/a.svelte", SOURCE, "/shop");

describe("a compiler's refusal of a view, as the bundler reports an error", () => {
  it("is at the view, named from where the build works, with the compiler's own words", () => {
    expect(refused(new Error("Unexpected token"))).toEqual({
      text: "Unexpected token",
      location: { file: "src/a/a.svelte" },
    });
    expect(refused("a string that was thrown").text).toBe("a string that was thrown");
  });

  it("is on the line Svelte names, with that line's text", () => {
    const said = Object.assign(new Error("Unexpected token"), { start: { line: 2, column: 4 } });
    expect(refused(said).location).toEqual({
      file: "src/a/a.svelte",
      line: 2,
      lineText: "<p>{</p>",
    });
  });

  it("is on the line Vue names, on the error or on what it gives as its cause", () => {
    const vues = Object.assign(new SyntaxError("Interpolation end sign was not found."), {
      loc: { start: { line: 2, column: 4, offset: 18 } },
    });
    expect(refused(vues).location).toMatchObject({ line: 2, lineText: "<p>{</p>" });
    expect(
      refused(new Error("Interpolation end sign was not found.", { cause: vues })).location,
    ).toMatchObject({ line: 2 });
  });

  it("names no line where the compiler named none it can be read from", () => {
    for (const said of [
      Object.assign(new Error("x"), { start: "2" }),
      Object.assign(new Error("x"), { loc: null }),
      Object.assign(new Error("x"), { start: { line: "2" } }),
    ]) {
      expect(refused(said).location).toEqual({ file: "src/a/a.svelte" });
    }
    // A line past the end of the file has no text to show.
    const past = Object.assign(new Error("x"), { start: { line: 9 } });
    expect(refused(past).location).toMatchObject({ line: 9, lineText: "" });
  });
});
