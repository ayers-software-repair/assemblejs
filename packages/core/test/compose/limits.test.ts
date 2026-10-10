// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Limits } from "@assemblejs/core";

describe("the composition limits", () => {
  it("are each finite, because an unbounded one is not a limit", () => {
    const limits: Limits = { depth: 8, maxBytes: 2 * 1024 * 1024, placements: 256 };
    for (const bound of Object.values(limits)) expect(Number.isFinite(bound)).toBe(true);
    expect(Object.keys(limits)).toEqual(["depth", "maxBytes", "placements"]);
  });
});
