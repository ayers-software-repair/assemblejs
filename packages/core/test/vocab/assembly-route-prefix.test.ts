// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ASSEMBLY_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";

describe("where an assembly answers", () => {
  it("is the contract's own surface, and does not collide with the framework's", () => {
    expect(ASSEMBLY_ROUTE_PREFIX).toBe("/assembly");
    expect(ASSEMBLY_ROUTE_PREFIX.startsWith(FRAMEWORK_ROUTE_PREFIX)).toBe(false);
    expect(FRAMEWORK_ROUTE_PREFIX.startsWith(ASSEMBLY_ROUTE_PREFIX)).toBe(false);
  });
});
