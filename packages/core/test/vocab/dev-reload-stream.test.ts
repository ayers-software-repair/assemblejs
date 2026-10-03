// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RELOAD_STREAM, DEVTOOLS_ROUTE_PREFIX } from "@assemblejs/core";

describe("the stream a page reloads by in development", () => {
  it("is under the devtools prefix, where nothing may write", () => {
    expect(DEV_RELOAD_STREAM).toBe(`${DEVTOOLS_ROUTE_PREFIX}/reload`);
  });
});
