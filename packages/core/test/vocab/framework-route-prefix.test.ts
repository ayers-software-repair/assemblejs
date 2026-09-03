// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";

describe("the framework's reserved surface", () => {
  it("is underscored, so it cannot be mistaken for a product route", () => {
    expect(FRAMEWORK_ROUTE_PREFIX).toBe("/_assemblejs");
    expect(FRAMEWORK_ROUTE_PREFIX.startsWith("/_")).toBe(true);
  });
});
