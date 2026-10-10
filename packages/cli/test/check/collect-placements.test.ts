// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { collectPlacements } from "@assemblejs/cli";

describe("gathering what a reader found into what a view places", () => {
  it("keeps each name and view once, in the order first written", () => {
    expect(
      collectPlacements([
        { name: "cart", view: "default", shown: "a" },
        { name: "price", view: "compact", shown: "b" },
        { name: "cart", view: "default", shown: "c" },
      ]),
    ).toEqual({
      placements: [
        { name: "cart", view: "default" },
        { name: "price", view: "compact" },
      ],
      unnamed: [],
    });
  });

  it("leaves a computed view out of its placement, and reports a computed name as written", () => {
    expect(
      collectPlacements([
        { name: "price", view: undefined, shown: "x" },
        { name: undefined, view: "default", shown: "slot(which)" },
      ]),
    ).toEqual({ placements: [{ name: "price" }], unnamed: ["slot(which)"] });
  });
});
