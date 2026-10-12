// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ENVELOPE_ELEMENT, OUTLINE_ELEMENT } from "@assemblejs/core";

describe("the element an outline is drawn in", () => {
  it("is a custom element's name, and not the envelope's", () => {
    expect(OUTLINE_ELEMENT).toMatch(/^[a-z]+-[a-z]+$/);
    expect(OUTLINE_ELEMENT).not.toBe(ENVELOPE_ELEMENT);
  });
});
