// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { relativeLuminance } from "@assemblejs/cli";

describe("the relative luminance of a hex colour", () => {
  it("is 0 for black, 1 for white, and WCAG's number in between", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 10);
    // #777777: each channel 119/255 = 0.4667, linearised 0.1845.
    expect(relativeLuminance("#777777")).toBeCloseTo(0.1845, 3);
    expect(relativeLuminance(" #FFF ")).toBeCloseTo(1, 10);
    // The channels weigh as WCAG weighs them: green most, blue least.
    expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 6);
    expect(relativeLuminance("#00ff00")).toBeCloseTo(0.7152, 6);
    expect(relativeLuminance("#0000ff")).toBeCloseTo(0.0722, 6);
  });

  it("judges nothing it is not certain of", () => {
    for (const other of ["red", "var(--ink)", "rgb(0, 0, 0)", "#12345", "#gggggg", ""]) {
      expect(relativeLuminance(other), other).toBeUndefined();
    }
  });
});
