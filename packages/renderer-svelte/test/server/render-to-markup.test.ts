// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-svelte";
import Counter from "../fixtures/Counter.svelte";

describe("rendering a Svelte assembly on the server", () => {
  it("produces the markup the server sends", () => {
    const html = renderToMarkup(Counter, { data: { label: "Clicked" }, children: {} });
    expect(html).toContain("Clicked");
    expect(html).toContain(`id="bump"`);
  });

  // Svelte's server render answers a head and a body. An assembly that wrote into the document
  // head from inside its own fragment would be writing outside the boundary the design draws.
  it("returns the body only, never the head", () => {
    const html = renderToMarkup(Counter, { data: { label: "x" }, children: {} });
    expect(html).not.toContain("<head");
    expect(html).not.toContain("<title");
  });

  it("throws rather than returning error markup", () => {
    expect(() => renderToMarkup(null, { data: {}, children: {} })).toThrow();
  });
});
