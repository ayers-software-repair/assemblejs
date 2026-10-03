// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { identifierFor } from "@assemblejs/cli";

describe("naming an import in generated code", () => {
  it("survives a hyphen, which an identifier cannot carry", () => {
    expect(identifierFor("view", "cart")).toBe("view_cart");
    expect(identifierFor("view", "hello-react")).toBe("view_helloReact");
    expect(identifierFor("api", "a-b-c")).toBe("api_aBC");
  });

  it("cannot collide with a keyword or a global, because it is prefixed by its kind", () => {
    for (const name of ["default", "class", "window", "import"]) {
      expect(identifierFor("view", name).startsWith("view_")).toBe(true);
    }
  });
});
