// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { placedBeneath } from "@assemblejs/core";
import type { PlacedAssembly, ViewPlacement } from "@assemblejs/core";

const one = (
  placements: Record<string, readonly ViewPlacement[]> = {},
  views: readonly string[] = ["default"],
): PlacedAssembly => ({ views, browserHalf: false, placements });
const all = new Map<string, PlacedAssembly>([
  ["shell", one({ default: [{ name: "cart", view: "default" }, { name: "gone" }] })],
  ["cart", one({ default: [{ name: "price" }, { name: "shell", view: "default" }] })],
  ["price", one({ compact: [{ name: "badge", view: "default" }] }, ["default", "compact"])],
  ["badge", one()],
]);
/** Every name and view reached, with the path of names that led to each. */
const walk = (name: string, view = "default"): string[] => {
  const reached: string[] = [];
  placedBeneath(
    { name, view },
    (wanted) => all.get(wanted),
    (placed, above: string) => {
      reached.push(`${above}>${placed.name}/${placed.view}`);
      return `${above}>${placed.name}`;
    },
    name,
  );
  return reached;
};

describe("everything a view's source is known to lead to", () => {
  it("is what it places, then what those views place, depth first, each handed what is above it", () => {
    expect(walk("shell")).toEqual([
      "shell>cart/default",
      "shell>cart>price/default",
      "shell>cart>price/compact",
      "shell>cart>price>badge/default",
    ]);
  });

  it("takes a placement whose view is computed for every view the assembly has", () => {
    expect(walk("cart").filter((reached) => reached.includes("price/"))).toHaveLength(2);
  });

  it("visits each name and view once, so a view that leads back to itself ends the walk", () => {
    // cart places shell, which places cart: neither is reached a second time.
    expect(walk("cart")).toEqual([
      "cart>price/default",
      "cart>price/compact",
      "cart>price>badge/default",
      "cart>shell/default",
    ]);
  });

  it("passes over a name no assembly answers to, and finds nothing beneath a view that places none", () => {
    expect(walk("shell").join()).not.toContain("gone");
    expect(walk("badge")).toEqual([]);
    expect(walk("price", "default")).toEqual([]);
    expect(walk("nobody")).toEqual([]);
  });
});
