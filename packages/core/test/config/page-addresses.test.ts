// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageAddresses } from "@asmjs/core";

describe("where perf weighs a page with a parameter", () => {
  it("is one example address for each route, keyed by the route as the page declares it", () => {
    const addresses: PageAddresses = { "/product/:sku": "/product/kettle-1" };
    expect(addresses["/product/:sku"]).toBe("/product/kettle-1");
    expect(addresses["/shelf/:name"]).toBeUndefined();
  });
});
