// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { SEGMENT, SEGMENT_PATTERN } from "@assemblejs/core";

describe("the segment shape", () => {
  it("accepts a lower-case name that starts with a letter, with digits and hyphens after", () => {
    for (const good of ["cart", "price-2", "a", "x0"]) expect(SEGMENT.test(good)).toBe(true);
  });

  it("refuses what could never be a declared name or a usable url segment", () => {
    for (const bad of ["Price", "1cart", "cart name", "../x", 'x"y', "", "-x", "cart,other"]) {
      expect(SEGMENT.test(bad)).toBe(false);
    }
  });

  // identity("a/b", "c") and identity("a", "b/c") were once both "a/b/c": a separator inside a
  // segment made two assemblies share one identity and one cache key.
  it("refuses the identity separator, and is anchored so a segment inside a string is not one", () => {
    expect(SEGMENT.test("a/b")).toBe(false);
    expect(SEGMENT.test("b/")).toBe(false);
    expect(SEGMENT.source).toBe(`^${SEGMENT_PATTERN}$`);
  });
});
