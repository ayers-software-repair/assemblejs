// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { findEnvelopes } from "@assemblejs/core/client";

describe("finding envelopes", () => {
  it("returns them in document order, which is nesting order", () => {
    document.body.innerHTML = `
      <assembly-root data-id="outer">
        <assembly-root data-id="inner"></assembly-root>
      </assembly-root>
      <assembly-root data-id="sibling"></assembly-root>`;
    // Outer before inner: an inner assembly mounts into markup the outer already treated as an
    // opaque child, and mounting inner-first hands the outer a subtree another framework drives.
    expect(findEnvelopes(document).map((e) => e.getAttribute("data-id"))).toEqual([
      "outer",
      "inner",
      "sibling",
    ]);
  });

  it("finds nothing in a page with no assemblies", () => {
    document.body.innerHTML = `<main><p>static</p></main>`;
    expect(findEnvelopes(document)).toEqual([]);
  });
});
