// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Limits } from "@assemblejs/core";

describe("the composition limits", () => {
  it("are both finite, because an unbounded one is not a limit", () => {
    const limits: Limits = { depth: 8, maxBytes: 2 * 1024 * 1024 };
    expect(Number.isFinite(limits.depth)).toBe(true);
    expect(Number.isFinite(limits.maxBytes)).toBe(true);
  });
});
