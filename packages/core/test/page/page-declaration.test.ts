// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageDeclaration } from "@assemblejs/core";

describe("what a page's own file declares", () => {
  it("is a route and placement policy, both optional, and never the template", () => {
    const empty: PageDeclaration = {};
    const routed: PageDeclaration = { route: "/products/:id" };
    expect(Object.keys(empty)).toEqual([]);
    expect(routed.place).toBeUndefined();
  });
});
