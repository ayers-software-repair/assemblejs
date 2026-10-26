// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useId } from "react";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@asmjs/renderer-react";
import { hydrate, useEvents } from "@asmjs/renderer-react/client";
import type { AssemblyProps } from "@asmjs/renderer-react";

const Cart = ({ data }: AssemblyProps) => <p>Items: {String(data["total"])}</p>;

describe("rendering a React assembly on the server", () => {
  it("produces the markup the server sends", () => {
    const html = renderToMarkup(Cart, { data: { total: 2 } });
    // React separates adjacent text nodes with an empty comment so hydration can find the
    // boundary again. It is part of the contract with react-dom and not noise to strip: a
    // server that removed it would produce markup the client could not hydrate.
    expect(html).toBe("<p>Items: <!-- -->2</p>");
  });

  it("escapes what it renders, because React does", () => {
    const Danger = ({ data }: AssemblyProps) => <p>{String(data["text"])}</p>;
    const html = renderToMarkup(Danger, {
      data: { text: "<script>alert(1)</script>" },
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  // React numbers the ids `useId` makes from the root of each render, so two islands on a page
  // made the same ones: a label in one named the input in the other.
  it("gives the ids a component makes the placement's id before them, so no two islands share one", () => {
    const Field = () => {
      const id = useId();
      return (
        <label htmlFor={id}>
          q<input id={id} />
        </label>
      );
    };
    const made = (id: string) =>
      / id="([^"]+)"/.exec(renderToMarkup(Field, { data: {}, id }))?.[1] ?? "";
    expect(made("aaaa")).toContain("aaaa");
    expect(made("bbbb")).toContain("bbbb");
    expect(made("aaaa")).not.toBe(made("bbbb"));
    // With no placement to name, the ids are React's own.
    expect(renderToMarkup(Field, { data: {} })).toMatch(/ id="[^"]+"/);
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
