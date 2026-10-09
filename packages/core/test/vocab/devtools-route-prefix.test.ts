// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEVTOOLS_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";

describe("where devtools are mounted", () => {
  it("is under the framework's own prefix, where no product route can be", () => {
    expect(DEVTOOLS_ROUTE_PREFIX).toBe(`${FRAMEWORK_ROUTE_PREFIX}/devtools`);
  });
});
