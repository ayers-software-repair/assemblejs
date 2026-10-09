// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RELOAD_SCRIPT, DEVTOOLS_ROUTE_PREFIX } from "@assemblejs/core";

describe("the script a page reloads with in development", () => {
  it("is under the devtools prefix, where nothing may write", () => {
    expect(DEV_RELOAD_SCRIPT).toBe(`${DEVTOOLS_ROUTE_PREFIX}/reload.js`);
  });
});
