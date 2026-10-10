// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-svelte";
import Counter from "../fixtures/Counter.svelte";
import Listener from "../fixtures/Listener.svelte";
import Shell from "../fixtures/Shell.svelte";

describe("rendering a Svelte assembly on the server", () => {
  it("produces the markup the server sends", () => {
    const html = renderToMarkup(Counter, { data: { label: "Clicked" } });
    expect(html).toContain("Clicked");
    expect(html).toContain(`id="bump"`);
  });

  // Svelte's server render answers a head and a body. An assembly that wrote into the document
  // head from inside its own fragment would be writing outside the boundary the design draws.
  it("returns the body only, never the head", () => {
    const html = renderToMarkup(Counter, { data: { label: "x" } });
    expect(html).not.toContain("<head");
    expect(html).not.toContain("<title");
  });

  it("throws rather than returning error markup", () => {
    expect(() => renderToMarkup(null, { data: {} })).toThrow();
  });

  // Written with Svelte's raw form, alone in its element and among other content: each stands
  // between the markers Svelte claims it by when it hydrates.
  it("renders a slot as the directive, where the composer reads it as that placement", () => {
    const html = renderToMarkup(Shell, { data: {} });
    expect(html).toMatch(/<div><!--[^>]*--><assembly name="inner"><\/assembly><!----><\/div>/);
    expect(findPlacements(html)).toMatchObject([
      { name: "inner", view: "default" },
      { name: "price", view: "compact" },
    ]);
  });

  it("hands the component its events, as it will hydrate with them", () => {
    expect(renderToMarkup(Listener, { data: {} })).toContain("<p>nothing yet</p>");
  });
});
