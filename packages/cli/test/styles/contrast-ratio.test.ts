// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@assemblejs/cli";

describe("the contrast ratio of two colours", () => {
  it("is 21 for black on white, 1 for a colour on itself, and the same either way round", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#0b5d4e", "#0b5d4e")).toBe(1);
    // #777 on white is the classic near miss: under 4.5.
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("is nothing where either colour is not judged", () => {
    expect(contrastRatio("#000", "var(--surface)")).toBeUndefined();
    expect(contrastRatio("red", "#fff")).toBeUndefined();
  });
});
