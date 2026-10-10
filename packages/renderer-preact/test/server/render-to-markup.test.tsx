// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-preact";
import { useEvents } from "@assemblejs/renderer-preact/client";
import type { AssemblyProps } from "@assemblejs/renderer-preact";

const Cart = ({ data }: AssemblyProps) => <p>Items: {String(data["total"])}</p>;

describe("rendering a Preact assembly on the server", () => {
  it("produces the markup the server sends", () => {
    expect(renderToMarkup(Cart, { data: { total: 2 } })).toBe("<p>Items: 2</p>");
  });

  it("escapes what it renders, because Preact does", () => {
    const Danger = ({ data }: AssemblyProps) => <p>{String(data["text"])}</p>;
    const html = renderToMarkup(Danger, {
      data: { text: "<script>alert(1)</script>" },
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script>");
  });

  // A renderer that returned its own error markup would produce something that passes every
  // check downstream, so the page looks fine and is wrong.
  it("throws rather than returning error markup", () => {
    const Broken = () => {
      throw new Error("this component is broken");
    };
    expect(() => renderToMarkup(Broken, { data: {} })).toThrow("this component is broken");
  });

  it("renders a component that uses its events, as it will hydrate", () => {
    const Readout = () => {
      const events = useEvents();
      return <p>{events.last("counted") === undefined ? "nothing yet" : "heard"}</p>;
    };
    expect(renderToMarkup(Readout, { data: {} })).toBe("<p>nothing yet</p>");
  });
});
