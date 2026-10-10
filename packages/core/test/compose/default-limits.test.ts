// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEFAULT_LIMITS } from "@assemblejs/core";

describe("the default limits", () => {
  it("bound depth, size and how many, and each is finite", () => {
    expect(Number.isFinite(DEFAULT_LIMITS.depth)).toBe(true);
    expect(Number.isFinite(DEFAULT_LIMITS.maxBytes)).toBe(true);
    expect(DEFAULT_LIMITS.depth).toBeGreaterThan(0);
    // Chosen from a measure: the page that places the most, of every example and fixture,
    // places 24 (DECISIONS 2026-10-10, "how many assemblies one request places").
    expect(DEFAULT_LIMITS.placements).toBe(256);
  });
});
