// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ASSET_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";

describe("where built browser files are served", () => {
  it("is under the framework's reserved prefix, so no product route can shadow it", () => {
    expect(ASSET_ROUTE_PREFIX).toBe("/_assemblejs/assets");
    expect(ASSET_ROUTE_PREFIX.startsWith(`${FRAMEWORK_ROUTE_PREFIX}/`)).toBe(true);
  });
});
