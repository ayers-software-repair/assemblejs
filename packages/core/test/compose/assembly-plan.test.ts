// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyPlan } from "@assemblejs/core";

describe("a placement", () => {
  it("needs only a name, a view and a finite deadline", () => {
    const local: AssemblyPlan = { name: "cart", view: "default", deadline: 3000 };
    expect(Number.isFinite(local.deadline)).toBe(true);
    expect(local.url).toBeUndefined();
  });

  it("says it lives on another server by carrying a url", () => {
    const remote: AssemblyPlan = {
      name: "cart",
      view: "default",
      url: "https://checkout.example.com/assembly/cart/",
      deadline: 500,
      fallback: "<p>Cart unavailable</p>",
    };
    expect(new URL(remote.url ?? "").origin).toBe("https://checkout.example.com");
  });
});
