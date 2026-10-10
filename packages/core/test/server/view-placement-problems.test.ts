// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { viewPlacementProblems } from "@assemblejs/core";
import type { PlacedAssembly, ViewPlacement } from "@assemblejs/core";

const placing = (
  placements: readonly ViewPlacement[],
  views: readonly string[] = ["default"],
): PlacedAssembly => ({ views, browserHalf: false, placements: { default: placements } });
const problems = (all: Record<string, PlacedAssembly>, name = "shell") =>
  viewPlacementProblems(
    `assembly "${name}"`,
    { name, view: "default" },
    new Map(Object.entries(all)),
  );

describe("what is wrong with what a view's source is known to place", () => {
  it("is nothing for placements of what exists, written view or computed", () => {
    expect(
      problems({
        shell: placing([{ name: "cart", view: "default" }, { name: "price" }]),
        cart: placing([]),
        price: placing([], ["default", "compact"]),
      }),
    ).toEqual([]);
  });

  it("refuses a name with no assembly behind it, naming it", () => {
    expect(problems({ shell: placing([{ name: "nope" }]) })).toEqual([
      {
        name: "nope",
        about: "assembly",
        message: 'assembly "shell" places "nope", and there is no such assembly',
      },
    ]);
  });

  it("refuses a view the assembly does not have, naming the view", () => {
    const found = problems({
      shell: placing([{ name: "cart", view: "wide" }]),
      cart: placing([]),
    });
    expect(found).toMatchObject([{ name: "cart", about: "view" }]);
    expect(found[0]?.message).toContain('with a view "wide" it does not have');
  });

  it("refuses a view that places itself, and one whose placements lead back to it", () => {
    expect(problems({ shell: placing([{ name: "shell", view: "default" }]) })).toMatchObject([
      { name: "shell", about: "cycle" },
    ]);
    const round = problems({
      shell: placing([{ name: "cart", view: "default" }]),
      cart: placing([{ name: "price", view: "default" }]),
      price: placing([{ name: "shell", view: "default" }]),
    });
    expect(round).toMatchObject([{ name: "cart", about: "cycle" }]);
    expect(round[0]?.message).toContain("lead back to it");
  });

  // Only a render knows which view a computed one is, so nothing is refused on a guess.
  it("holds a placement whose view is computed for its name alone, and does not follow it", () => {
    expect(problems({ shell: placing([{ name: "shell" }]) })).toEqual([]);
    expect(
      problems({
        shell: placing([{ name: "cart", view: "default" }]),
        cart: placing([{ name: "shell" }]),
      }),
    ).toEqual([]);
  });

  it("says each thing once, however often the view writes it", () => {
    expect(problems({ shell: placing([{ name: "nope" }, { name: "nope" }]) })).toHaveLength(1);
  });
});
