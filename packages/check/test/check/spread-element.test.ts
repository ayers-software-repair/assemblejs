// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { spreadElement } from "@asmjs/check";

const element = (computed: boolean, attributes: [string, string | true][]) => ({
  tag: "img",
  attributes: new Map(attributes),
  at: 0,
  computed,
});

describe("an element the view spreads onto", () => {
  it("is computed with no attribute of its own standing as the marker", () => {
    expect(spreadElement(element(true, [["src", "a.png"]]))).toBe(true);
    expect(spreadElement(element(true, []))).toBe(true);
  });

  // A spread and a computed attribute on one element was read as the second alone, and the
  // element then held to an attribute its spread may carry.
  it("is one that carries an attribute nobody can name, whatever else on it is computed", () => {
    expect(
      spreadElement(
        element(true, [
          [COMPUTED_MARKER, true],
          ["src", COMPUTED_MARKER],
        ]),
      ),
    ).toBe(true);
  });

  it("is not one whose attribute is computed, nor one written whole", () => {
    expect(spreadElement(element(true, [["alt", COMPUTED_MARKER]]))).toBe(false);
    expect(spreadElement(element(false, [["src", "a.png"]]))).toBe(false);
  });
});
