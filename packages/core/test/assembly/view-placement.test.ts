// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ViewPlacement } from "@assemblejs/core";

describe("one assembly a view's source is known to place", () => {
  it("names the assembly, and its view only where the source writes one", () => {
    const written: ViewPlacement = { name: "price", view: "compact" };
    // A view the source computes is left out, for only a render knows it.
    const computed: ViewPlacement = { name: "price" };
    expect([written.view, computed.view]).toEqual(["compact", undefined]);
  });
});
