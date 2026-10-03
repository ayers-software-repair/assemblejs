// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RELOAD_STREAM, FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";

describe("the stream a page reloads by in development", () => {
  it("is under the framework's own prefix, where no product route can be", () => {
    expect(DEV_RELOAD_STREAM).toBe(`${FRAMEWORK_ROUTE_PREFIX}/dev/reload`);
  });
});
