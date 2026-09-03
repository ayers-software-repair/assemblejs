// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-react";
import type { AssemblyProps } from "@assemblejs/renderer-react";

const Cart = ({ data }: AssemblyProps) => <p>Items: {String(data["total"])}</p>;

describe("rendering a React assembly on the server", () => {
  it("produces the markup the server sends", () => {
    const html = renderToMarkup(Cart, { data: { total: 2 }, children: {} });
    // React separates adjacent text nodes with an empty comment so hydration can find the
    // boundary again. It is part of the contract with react-dom and not noise to strip: a
    // server that removed it would produce markup the client could not hydrate.
    expect(html).toBe("<p>Items: <!-- -->2</p>");
  });

  it("escapes what it renders, because React does", () => {
    const Danger = ({ data }: AssemblyProps) => <p>{String(data["text"])}</p>;
    const html = renderToMarkup(Danger, {
      data: { text: "<script>alert(1)</script>" },
      children: {},
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  // A renderer that returned its own error markup would produce something that passes every
  // check downstream, so the page looks fine and is wrong.
  it("throws rather than returning error markup", () => {
    const Broken = () => {
      throw new Error("this component is broken");
    };
    expect(() => renderToMarkup(Broken, { data: {}, children: {} })).toThrow(
      "this component is broken",
    );
  });
});
