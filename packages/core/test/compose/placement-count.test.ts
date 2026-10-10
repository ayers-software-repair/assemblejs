// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PlacementCount } from "@assemblejs/core";

describe("the count of one request's placements", () => {
  it("numbers a placement, is told of one refused, and accounts for those in one diagnostic", () => {
    let placed = 0;
    const count: PlacementCount = {
      next: () => (placed += 1),
      refuse: () => "c-1",
      account: () => undefined,
    };
    expect(count.next()).toBe(1);
    expect(count.refuse("cart", "default")).toBe("c-1");
    expect(count.account()).toBeUndefined();
  });
});
