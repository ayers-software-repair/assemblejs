// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEFAULT_DEADLINE, pagePlan } from "@assemblejs/core";

describe("a page's plan for the composer", () => {
  it("has no entry for a placement with no policy", () => {
    expect(pagePlan({ route: "/", template: '<assembly name="a"></assembly>' })).toEqual({});
  });

  it("carries the policy, the placed view, and the default deadline where none was named", () => {
    const plan = pagePlan({
      route: "/",
      template: '<assembly name="cart" view="compact"></assembly>',
      place: { cart: { fallback: "<p>Cart unavailable</p>", required: true } },
    });
    expect(plan).toEqual({
      cart: {
        name: "cart",
        view: "compact",
        deadline: DEFAULT_DEADLINE,
        fallback: "<p>Cart unavailable</p>",
        required: true,
      },
    });
  });
});
