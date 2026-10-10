// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ViewPlacements } from "@assemblejs/cli";

describe("what a view's source says it places", () => {
  it("is what was read, or undefined where the source cannot be read for it at all", () => {
    const read: ViewPlacements = { placements: [{ name: "cart", view: "default" }], unnamed: [] };
    const unread: ViewPlacements = { placements: undefined, unnamed: [] };
    expect([read.placements?.length, unread.placements]).toEqual([1, undefined]);
  });
});
