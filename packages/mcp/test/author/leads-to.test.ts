// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { leadsTo } from "@assemblejs/mcp";

const placements = new Map(
  Object.entries({
    shell: [{ name: "nav" }, { name: "cart" }],
    nav: [{ name: "menu" }],
    menu: [{ name: "link" }, { name: "nav" }],
    cart: [{ name: "price" }],
  }),
);

describe("how one assembly leads to another through what each view places", () => {
  it("is the names from the first to the second, each placing the next", () => {
    expect(leadsTo(placements, "shell", "nav")).toEqual(["shell", "nav"]);
    expect(leadsTo(placements, "shell", "link")).toEqual(["shell", "nav", "menu", "link"]);
    expect(leadsTo(placements, "nav", "nav")).toEqual(["nav"]);
  });

  it("is nothing where it does not lead there, a circle on the way included", () => {
    expect(leadsTo(placements, "nav", "shell")).toBeUndefined();
    expect(leadsTo(placements, "price", "shell")).toBeUndefined();
    expect(leadsTo(placements, "nowhere", "shell")).toBeUndefined();
  });

  it("is the shortest way where there are two", () => {
    const two = new Map(
      Object.entries({ a: [{ name: "b" }, { name: "d" }], b: [{ name: "c" }], c: [{ name: "d" }] }),
    );
    expect(leadsTo(two, "a", "d")).toEqual(["a", "d"]);
  });
});
