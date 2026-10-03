// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateApis } from "@assemblejs/cli";

describe("generating the apis the built server imports", () => {
  it("imports one default export per api file", () => {
    const source = generateApis(
      ["/p/src/api/time.api.ts", "/p/src/api/cart-items.api.ts"],
      "/p/.assemblejs",
    );
    expect(source).toContain('import api_time from "../src/api/time.api.js";');
    expect(source).toContain('import api_cartItems from "../src/api/cart-items.api.js";');
    expect(source).toContain(
      "export const apis: readonly ApiDefinition[] = [api_time, api_cartItems];",
    );
  });

  it("generates a valid empty list", () => {
    expect(generateApis([], "/p/.assemblejs")).toContain("readonly ApiDefinition[] = [];");
  });
});
