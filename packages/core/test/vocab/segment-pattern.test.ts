// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { SEGMENT_PATTERN } from "@assemblejs/core";

describe("the segment pattern", () => {
  it("can be embedded in a longer pattern: no anchors, no groups of its own", () => {
    expect(SEGMENT_PATTERN).not.toMatch(/[$^()]/);
    const path = new RegExp(`^/(${SEGMENT_PATTERN})/(${SEGMENT_PATTERN})/$`);
    expect(path.exec("/cart/compact/")?.slice(1)).toEqual(["cart", "compact"]);
    expect(path.test("/Cart/compact/")).toBe(false);
  });
});
