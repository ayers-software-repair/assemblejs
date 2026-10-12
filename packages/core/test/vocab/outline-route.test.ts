// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEVTOOLS_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX, OUTLINE_ROUTE } from "@assemblejs/core";

describe("what a server serves for a page's outline", () => {
  it("is under the framework's prefix, and outside the devtools, which production never mounts", () => {
    for (const path of Object.values(OUTLINE_ROUTE)) {
      expect(path.startsWith(`${FRAMEWORK_ROUTE_PREFIX}/outline`)).toBe(true);
      expect(path.startsWith(DEVTOOLS_ROUTE_PREFIX)).toBe(false);
    }
    expect(new Set(Object.values(OUTLINE_ROUTE)).size).toBe(3);
  });
});
