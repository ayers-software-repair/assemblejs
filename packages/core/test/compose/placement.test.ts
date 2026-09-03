// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Placement } from "@assemblejs/core";

describe("a placement", () => {
  it("says where in the template it sits, so it can be replaced in place", () => {
    const placement: Placement = { name: "cart", view: "default", start: 6, end: 32 };
    expect(placement.end).toBeGreaterThan(placement.start);
  });
});
