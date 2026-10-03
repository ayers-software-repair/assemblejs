// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { scopeCss } from "@assemblejs/cli";

const scope = (css: string) => scopeCss(css, "cart", "cart.css").replace(/\s+/g, " ").trim();

describe("scoping an assembly's stylesheet", () => {
  it("puts every selector inside the assembly's envelope", () => {
    expect(scope(".title { color: red }")).toBe(
      'assembly-root[data-name="cart"] .title { color: red }',
    );
    expect(scope("p, .a > .b { margin: 0 }")).toBe(
      'assembly-root[data-name="cart"] p, assembly-root[data-name="cart"] .a > .b { margin: 0 }',
    );
  });

  it("names the envelope itself with :scope", () => {
    expect(scope(":scope { display: block }")).toBe(
      'assembly-root[data-name="cart"] { display: block }',
    );
    expect(scope(":scope > p { margin: 0 }")).toBe(
      'assembly-root[data-name="cart"] > p { margin: 0 }',
    );
  });

  it("scopes inside @media, @supports and @layer", () => {
    expect(scope("@media (min-width: 1px) { .a { color: red } }")).toContain(
      '@media (min-width: 1px) { assembly-root[data-name="cart"] .a',
    );
    expect(scope("@supports (display: grid) { .a { display: grid } }")).toContain(
      'assembly-root[data-name="cart"] .a',
    );
    expect(scope("@layer base { .a { color: red } }")).toContain(
      'assembly-root[data-name="cart"] .a',
    );
  });

  it("leaves what is global by nature global, as documented", () => {
    const css = scope(
      '@import "x.css"; @keyframes pulse { from { opacity: 0 } to { opacity: 1 } } @font-face { font-family: X; src: url(x.woff2) } @page { margin: 1cm }',
    );
    expect(css).toContain('@import "x.css"');
    expect(css).toContain("@keyframes pulse { from { opacity: 0 } to { opacity: 1 } }");
    expect(css).toContain("@font-face { font-family: X;");
    expect(css).toContain("@page { margin: 1cm }");
    expect(css).not.toContain("data-name");
  });
});
