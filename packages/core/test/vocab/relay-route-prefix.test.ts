// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { FRAMEWORK_ROUTE_PREFIX, RELAY_ROUTE_PREFIX } from "@asmjs/core";

describe("where the page's server relays a remote's api calls", () => {
  it("is under the framework's reserved prefix, so no product route can shadow it", () => {
    expect(RELAY_ROUTE_PREFIX).toBe("/_assemblejs/remote");
    expect(RELAY_ROUTE_PREFIX.startsWith(`${FRAMEWORK_ROUTE_PREFIX}/`)).toBe(true);
  });
});
