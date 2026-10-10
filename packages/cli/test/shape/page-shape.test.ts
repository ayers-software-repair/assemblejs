// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageShape } from "@assemblejs/cli";

describe("one page as its sources say it", () => {
  it("is its route, its files, what it places and the policy it declares", () => {
    const page: PageShape = {
      name: "home",
      route: "/",
      template: "src/pages/home/home.html",
      declaration: "src/pages/home/home.page.ts",
      places: [{ name: "cart", view: "default" }],
      policy: { cart: { defer: true } },
      stream: null,
    };
    expect(Object.keys(page)).toEqual([
      "name",
      "route",
      "template",
      "declaration",
      "places",
      "policy",
      "stream",
    ]);
  });
});
