// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { limitProblems } from "@asmjs/core";

describe("what is wrong with the limits a project set", () => {
  it("is nothing for none, or for whole numbers in their bounds", () => {
    expect(limitProblems(undefined)).toEqual([]);
    expect(limitProblems({})).toEqual([]);
    expect(limitProblems({ depth: 0, placements: 1 })).toEqual([]);
    expect(limitProblems({ depth: 12, placements: 1000 })).toEqual([]);
  });

  it("names a depth that is not a whole number of zero or more", () => {
    expect(limitProblems({ depth: -1 })).toEqual([
      "limits.depth is -1, and must be a whole number of zero or more",
    ]);
    expect(limitProblems({ depth: 2.5 })).toHaveLength(1);
    expect(limitProblems({ depth: Number.NaN })).toHaveLength(1);
  });

  it("names a count of placements that is not a whole number of one or more", () => {
    expect(limitProblems({ placements: 0 })).toEqual([
      "limits.placements is 0, and must be a whole number of one or more",
    ]);
    expect(limitProblems({ placements: 10.5 })).toHaveLength(1);
    expect(limitProblems({ depth: -1, placements: 0 })).toHaveLength(2);
  });
});
