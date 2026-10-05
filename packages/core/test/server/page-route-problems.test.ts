// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { pageRouteProblems } from "@assemblejs/core";

describe("a page's route on its own", () => {
  it("passes a flat route of literal segments and whole-segment parameters", () => {
    expect(pageRouteProblems("/")).toEqual([]);
    expect(pageRouteProblems("/shop/basket")).toEqual([]);
    expect(pageRouteProblems("/products/:id")).toEqual([]);
  });

  it("refuses each route the server refuses at boot, naming why", () => {
    const cases: Array<[string, RegExp]> = [
      ["shop", /does not start with "\/"/],
      ["/shop/*", /wildcard/],
      ["/a b", /not a flat path/],
      ["/_assemblejs/x", /reserves/],
      ["/assembly/x", /reserves/],
    ];
    for (const [route, problem] of cases) {
      expect(pageRouteProblems(route).join("\n"), route).toMatch(problem);
    }
  });
});
