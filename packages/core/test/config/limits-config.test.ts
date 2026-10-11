// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { LimitsConfig } from "@assemblejs/core";

describe("the bounds a project sets on composition", () => {
  it("are how deep and how many, each a whole number, each optional", () => {
    const none: LimitsConfig = {};
    const both: LimitsConfig = { depth: 3, placements: 40 };
    expect(none.depth).toBeUndefined();
    expect([both.depth, both.placements]).toEqual([3, 40]);
  });
});
