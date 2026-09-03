// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION } from "@assemblejs/core";

describe("the assembly contract version", () => {
  it("is an integer at or above one", () => {
    expect(Number.isInteger(CONTRACT_VERSION)).toBe(true);
    expect(CONTRACT_VERSION).toBeGreaterThanOrEqual(1);
  });
});
