// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@asmjs/renderer-preact";
import { hydrate, useEvents } from "@asmjs/renderer-preact/client";
import type { AssemblyProps } from "@asmjs/renderer-preact";

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

  // The shape of its data is the type argument AssemblyProps exists to take, and a view that
  // gave one was refused by the function that renders it and by the one that hydrates it.
  it("takes a view that says what its data holds", () => {
    const Priced = ({ data }: AssemblyProps<{ cents: number }>) => <p>{data.cents / 100}</p>;
    expect(renderToMarkup(Priced, { data: { cents: 250 } })).toBe("<p>2.5</p>");
    expect(typeof hydrate(Priced).mount).toBe("function");
  });
});
