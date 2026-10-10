// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { noSuchAssembly } from "@assemblejs/mcp";

describe("what an agent is told about a name with no assembly behind it", () => {
  it("is the assemblies that do exist, or that there are none at all", () => {
    expect(noSuchAssembly("checkout", ["cart", "header"])).toBe(
      'there is no assembly "checkout". This project has: cart, header',
    );
    expect(noSuchAssembly("cart", [])).toContain("none at all");
  });
});
