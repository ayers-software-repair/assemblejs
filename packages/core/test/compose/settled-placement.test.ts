// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { SettledPlacement } from "@assemblejs/core";

describe("a settled placement", () => {
  it("pairs the html to substitute with the account of how it was reached", () => {
    const settled: SettledPlacement = {
      html: "<p>cart</p>",
      diagnostic: { name: "cart", view: "default", id: "a", source: "local", ms: 3 },
    };
    expect(settled.diagnostic.name).toBe("cart");
  });
});
