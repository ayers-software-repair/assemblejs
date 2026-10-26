// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ISLAND_ATTRIBUTE, OUTLINE_ATTRIBUTE } from "@asmjs/core";

describe("the attribute on the block that tells a page's outline of the page", () => {
  it("is a data attribute, and not the one an assembly's island carries", () => {
    expect(OUTLINE_ATTRIBUTE.startsWith("data-")).toBe(true);
    expect(OUTLINE_ATTRIBUTE).not.toBe(ISLAND_ATTRIBUTE);
  });
});
