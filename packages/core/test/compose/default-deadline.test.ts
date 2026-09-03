// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEFAULT_DEADLINE } from "@assemblejs/core";

describe("the default deadline", () => {
  it("is finite, because a placement with no deadline waits on someone else's outage", () => {
    expect(Number.isFinite(DEFAULT_DEADLINE)).toBe(true);
    expect(DEFAULT_DEADLINE).toBeGreaterThan(0);
  });
});
