// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEFAULT_LIMITS } from "@assemblejs/core";

describe("the default limits", () => {
  it("bound both depth and size, and both are finite", () => {
    expect(Number.isFinite(DEFAULT_LIMITS.depth)).toBe(true);
    expect(Number.isFinite(DEFAULT_LIMITS.maxBytes)).toBe(true);
    expect(DEFAULT_LIMITS.depth).toBeGreaterThan(0);
  });
});
