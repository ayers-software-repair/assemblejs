// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RELOAD_SCRIPT, FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";

describe("the script a page reloads with in development", () => {
  it("is under the framework's own prefix, where no product route can be", () => {
    expect(DEV_RELOAD_SCRIPT).toBe(`${FRAMEWORK_ROUTE_PREFIX}/dev/reload.js`);
  });
});
