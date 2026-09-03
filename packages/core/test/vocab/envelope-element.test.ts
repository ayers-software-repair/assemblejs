// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ENVELOPE_ELEMENT, PLACEMENT_ELEMENT } from "@assemblejs/core";

describe("the envelope element", () => {
  it("carries the hyphen a real custom element requires", () => {
    expect(ENVELOPE_ELEMENT).toBe("assembly-root");
    expect(ENVELOPE_ELEMENT).toContain("-");
  });

  it("is not the element an author writes, because the two positions differ", () => {
    expect(ENVELOPE_ELEMENT).not.toBe(PLACEMENT_ELEMENT);
  });
});
