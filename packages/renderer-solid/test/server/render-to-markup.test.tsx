// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-solid";
import { useEvents } from "@assemblejs/renderer-solid/client";
import type { AssemblyProps } from "@assemblejs/renderer-solid";
import { COUNTER_MARKUP } from "../fixtures/counter-markup.js";
import { Counter } from "../fixtures/counter.js";

const Cart = (props: AssemblyProps) => <p>Items: {String(props.data["total"])}</p>;

describe("rendering a Solid assembly on the server", () => {
  it("produces the markup the server sends, with the keys hydration adopts it by", () => {
    const html = renderToMarkup(Cart, { data: { total: 2 }, children: {} });
    expect(html).toMatch(/^<p data-hk="[^"]+">Items: <!--\$-->2<!--\/--><\/p>$/);
  });

  it("renders exactly the markup the browser half is tested hydrating", () => {
    expect(renderToMarkup(Counter, { data: { label: "Clicked" }, children: {} })).toBe(
      COUNTER_MARKUP,
    );
  });

  it("escapes what it renders, because Solid does", () => {
    const Danger = (props: AssemblyProps) => <p>{String(props.data["text"])}</p>;
    const html = renderToMarkup(Danger, {
      data: { text: "<script>alert(1)</script>" },
      children: {},
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script>");
  });

  // A renderer that returned its own error markup would produce something that passes every
  // check downstream, so the page looks fine and is wrong.
  it("throws rather than returning error markup", () => {
    const Broken = (): never => {
      throw new Error("this component is broken");
    };
    expect(() => renderToMarkup(Broken, { data: {}, children: {} })).toThrow(
      "this component is broken",
    );
  });

  it("renders a component that uses its events, as it will hydrate", () => {
    const Readout = () => {
      const events = useEvents();
      return <p>{events.last("counted") === undefined ? "nothing yet" : "heard"}</p>;
    };
    expect(renderToMarkup(Readout, { data: {}, children: {} })).toContain("nothing yet");
  });
});
