// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { reservedPrefix } from "@assemblejs/core";

describe("the framework's reserved prefixes", () => {
  it("names the prefix a route would land under, whatever its case", () => {
    expect(reservedPrefix("/assembly/cart/")).toBe("/assembly");
    expect(reservedPrefix("/ASSEMBLY")).toBe("/assembly");
    expect(reservedPrefix("/_assemblejs/health")).toBe("/_assemblejs");
  });

  it("does not claim a route that merely starts with the same letters", () => {
    expect(reservedPrefix("/assembly-line")).toBeUndefined();
    expect(reservedPrefix("/")).toBeUndefined();
  });
});
