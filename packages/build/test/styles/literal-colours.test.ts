// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { literalColours } from "@asmjs/build";

describe("the literal colours a value holds", () => {
  it("finds a hex colour, a colour function and a named colour, in any case", () => {
    expect(literalColours("#FFF")).toEqual(["#FFF"]);
    expect(literalColours("1px solid #1a2b3c80")).toEqual(["#1a2b3c80"]);
    expect(literalColours("rgb(1 2 3 / 50%) Red")).toEqual(["rgb(1 2 3 / 50%)", "Red"]);
    expect(literalColours("oklch(60% 0.1 200) hsla(1,2%,3%,.4)")).toEqual([
      "oklch(60% 0.1 200)",
      "hsla(1,2%,3%,.4)",
    ]);
    expect(literalColours("color(display-p3 1 0 0)")).toEqual(["color(display-p3 1 0 0)"]);
  });

  it("passes a token, transparent, currentcolor, a word that is not a colour, a string and a url", () => {
    expect(literalColours("var(--ink)")).toEqual([]);
    expect(literalColours("var(--red, var(--accent))")).toEqual([]);
    expect(literalColours("transparent")).toEqual([]);
    expect(literalColours("currentColor")).toEqual([]);
    expect(literalColours("1px solid")).toEqual([]);
    expect(literalColours('"red"')).toEqual([]);
    expect(literalColours("url(red.png) no-repeat")).toEqual([]);
    expect(literalColours("color-mix(in oklab, var(--ink), var(--surface))")).toEqual([]);
  });

  it("finds a literal beside a token, and a hex that is not a longer word", () => {
    expect(literalColours("color-mix(in srgb, var(--ink), white)")).toEqual(["white"]);
    expect(literalColours("#abc-ish")).toEqual([]);
  });
});
