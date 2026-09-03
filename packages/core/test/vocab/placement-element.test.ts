// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { PLACEMENT_ELEMENT } from "@assemblejs/core";

describe("the placement element", () => {
  it("is the plain noun, because the server replaces it and never emits it", () => {
    expect(PLACEMENT_ELEMENT).toBe("assembly");
    // No hyphen: a custom element needs one, and this is never a custom element.
    expect(PLACEMENT_ELEMENT).not.toContain("-");
  });
});
