// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PlacementCount } from "@asmjs/core";

describe("the count of one request's placements", () => {
  it("numbers a placement, is told of one refused and why, and accounts for those by reason", () => {
    let placed = 0;
    const count: PlacementCount = {
      next: () => (placed += 1),
      refuse: () => "c-1",
      account: () => [],
    };
    expect(count.next()).toBe(1);
    expect(count.refuse("too-many", "cart", "default")).toBe("c-1");
    expect(count.refuse("aborted", "cart", "default")).toBe("c-1");
    expect(count.account()).toEqual([]);
  });
});
