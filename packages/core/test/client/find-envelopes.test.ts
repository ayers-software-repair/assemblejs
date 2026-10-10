// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { findEnvelopes } from "@assemblejs/core/client";

const ids = (root: ParentNode): Array<string | null> =>
  findEnvelopes(root).map((envelope) => envelope.getAttribute("data-id"));

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

  // A selector does not cross into a shadow root, and a shadow assembly's children are in one.
  it("enters a shadow root where it stands, so a child placed inside one follows its parent", () => {
    document.body.innerHTML = `<assembly-root data-id="frame"></assembly-root><assembly-root data-id="after"></assembly-root>`;
    const frame = document.querySelector('[data-id="frame"]');
    if (frame === null) throw new Error("no frame");
    frame.attachShadow({ mode: "open" }).innerHTML =
      `<section><assembly-root data-id="child"><assembly-root data-id="grandchild"></assembly-root></assembly-root></section>`;
    expect(ids(document)).toEqual(["frame", "child", "grandchild", "after"]);
    // From the frame itself, as a filled placement is considered: what its own root holds.
    expect(ids(frame)).toEqual(["child", "grandchild"]);
  });

  it("enters the shadow root of an element that is not an envelope, too", () => {
    document.body.innerHTML = `<my-panel></my-panel><assembly-root data-id="beside"></assembly-root>`;
    const panel = document.querySelector("my-panel");
    if (panel === null) throw new Error("no panel");
    panel.attachShadow({ mode: "open" }).innerHTML =
      `<assembly-root data-id="inside"></assembly-root>`;
    expect(ids(document)).toEqual(["inside", "beside"]);
  });
});
