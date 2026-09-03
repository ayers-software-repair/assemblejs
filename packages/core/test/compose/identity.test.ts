// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { identity } from "@assemblejs/core";

describe("an assembly's identity", () => {
  it("is its name and view, which is what makes a cycle detectable", () => {
    expect(identity("cart", "default")).toBe("cart/default");
    // Two views of one assembly are two identities: one may contain the other without a cycle.
    expect(identity("cart", "compact")).not.toBe(identity("cart", "default"));
  });
});
