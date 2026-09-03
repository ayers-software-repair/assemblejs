// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { identifierFor } from "@assemblejs/cli";

describe("naming an assembly in generated code", () => {
  it("survives a hyphen, which an identifier cannot carry", () => {
    expect(identifierFor("cart")).toBe("assembly_cart");
    expect(identifierFor("hello-react")).toBe("assembly_helloReact");
    expect(identifierFor("a-b-c")).toBe("assembly_aBC");
  });

  it("cannot collide with a keyword or a global, because it is prefixed", () => {
    for (const name of ["default", "class", "window", "import"]) {
      expect(identifierFor(name).startsWith("assembly_")).toBe(true);
    }
  });
});
