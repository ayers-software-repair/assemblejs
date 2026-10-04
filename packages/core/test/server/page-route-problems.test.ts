// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { pageRouteProblems } from "@assemblejs/core";

describe("a page's route on its own", () => {
  it("passes a flat route of literal segments", () => {
    expect(pageRouteProblems("/")).toEqual([]);
    expect(pageRouteProblems("/shop/basket")).toEqual([]);
  });

  it("refuses each route the server refuses at boot, naming why", () => {
    const cases: Array<[string, RegExp]> = [
      ["shop", /does not start with "\/"/],
      ["/shop/*", /wildcard/],
      ["/a b", /not a flat path/],
      ["/products/:id", /has a parameter/],
      ["/_assemblejs/x", /reserves/],
      ["/assembly/x", /reserves/],
    ];
    for (const [route, problem] of cases) {
      expect(pageRouteProblems(route).join("\n"), route).toMatch(problem);
    }
  });
});
