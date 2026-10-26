// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { routeParameters } from "@asmjs/core";

describe("the names of a route's parameters", () => {
  it("are its whole segments that begin with a colon, in the order it writes them", () => {
    expect(routeParameters("/p/:sku")).toEqual(["sku"]);
    expect(routeParameters("/shops/:shop/orders/:id")).toEqual(["shop", "id"]);
  });

  it("are none for a route of literal segments, a colon inside one included", () => {
    expect(routeParameters("/")).toEqual([]);
    expect(routeParameters("/about/us")).toEqual([]);
    expect(routeParameters("/a:b/c")).toEqual([]);
  });
});
