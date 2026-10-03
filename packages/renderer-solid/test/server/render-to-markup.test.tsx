// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ErrorBoundary, Suspense, createResource } from "solid-js";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-solid";
import { useEvents } from "@assemblejs/renderer-solid/client";
import type { AssemblyProps } from "@assemblejs/renderer-solid";
import { counterMarkup } from "../fixtures/counter-markup.js";
import { Counter } from "../fixtures/counter.js";
import { LateIsland } from "../fixtures/late-island.js";
import { LATE_MARKUP } from "../fixtures/late-markup.js";
import { Late } from "../fixtures/late.js";
import { INNER_ENVELOPE, NESTED_MARKUP } from "../fixtures/nested-markup.js";
import { Outer } from "../fixtures/outer.js";

const Cart = (props: AssemblyProps) => <p>Items: {String(props.data["total"])}</p>;

describe("rendering a Solid assembly on the server", () => {
  it("produces the markup the server sends, with the keys hydration adopts it by", () => {
    const html = renderToMarkup(Cart, { data: { total: 2 }, children: {} });
    expect(html).toMatch(/^<p data-hk="[^"]+">Items: <!--\$-->2<!--\/--><\/p>$/);
  });

  it("renders exactly the markup the browser half is tested hydrating", async () => {
    for (const id of ["a", "b", "0f6c2a9e-4b1d-4c8a-9e2f-7d3b5a1c8e40"]) {
      expect(renderToMarkup(Counter, { data: { label: "Clicked" }, children: {}, id })).toBe(
        counterMarkup(id),
      );
    }
    expect(renderToMarkup(Outer, { data: {}, children: { inner: INNER_ENVELOPE }, id: "a" })).toBe(
      NESTED_MARKUP,
    );
    await Late.preload();
    expect(renderToMarkup(LateIsland, { data: {}, children: {}, id: "a" })).toBe(LATE_MARKUP);
  });

  // Solid writes what it serializes for its own bootstrap as an inline script: the page's policy
  // refuses it, and for a caught error it carries the error's message and the server's stack.
  it("leaves out the script Solid writes for a resource or a caught error", () => {
    const Loading = () => {
      const [value] = createResource(() => Promise.resolve(1));
      return (
        <div>
          <Suspense fallback={<i>wait</i>}>{value()}</Suspense>
        </div>
      );
    };
    const Caught = () => (
      <ErrorBoundary fallback={<b>caught</b>}>
        {(() => {
          throw new Error("server secret");
        })()}
      </ErrorBoundary>
    );
    const loading = renderToMarkup(Loading, { data: {}, children: {}, id: "a" });
    const caught = renderToMarkup(Caught, { data: {}, children: {}, id: "a" });
    expect(loading).toMatch(/^<div data-hk="a\d+"><i data-hk="[^"]+">wait<\/i><\/div>$/);
    expect(caught).toMatch(/^<b data-hk="a\d+">caught<\/b>$/);
    expect(caught).not.toContain("server secret");
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
