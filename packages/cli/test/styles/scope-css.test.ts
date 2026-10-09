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

  it("scopes a nested rule through the rule it is nested in, never twice", () => {
    expect(scope(".card { color: red; .t { color: blue } & .u { color: green } }")).toBe(
      'assembly-root[data-name="cart"] .card { color: red; .t { color: blue } & .u { color: green } }',
    );
    expect(scope(".card { @media (min-width: 1px) { .t { color: blue } } }")).not.toContain(
      "{ assembly-root",
    );
  });

  it("keeps a :scope inside :not() or :is() within the assembly", () => {
    expect(scope("div:not(:scope) { outline: 0 }")).toBe(
      'assembly-root[data-name="cart"] div:not(assembly-root[data-name="cart"]) { outline: 0 }',
    );
    expect(scope(":is(:scope, .zz) .leak { color: red }")).toBe(
      'assembly-root[data-name="cart"] :is(assembly-root[data-name="cart"], .zz) .leak { color: red }',
    );
  });

  it("reads a selector that starts at the document or the shadow host as the envelope", () => {
    for (const start of [":root", "html", "body", "BODY", ":host"]) {
      expect(scope(`${start} { margin: 0 }`), start).toBe(
        'assembly-root[data-name="cart"] { margin: 0 }',
      );
    }
    expect(scope("body .a { margin: 0 }")).toBe('assembly-root[data-name="cart"] .a { margin: 0 }');
    expect(scope("html body .a { margin: 0 }")).toBe(
      'assembly-root[data-name="cart"] .a { margin: 0 }',
    );
    expect(scope(":root > body > .a { margin: 0 }")).toBe(
      'assembly-root[data-name="cart"] > .a { margin: 0 }',
    );
  });

  it("drops a following body only when it is bare", () => {
    expect(scope("html body.x .a { margin: 0 }")).toBe(
      'assembly-root[data-name="cart"] body.x .a { margin: 0 }',
    );
    expect(scope("body body .a { margin: 0 }")).toBe(
      'assembly-root[data-name="cart"] body .a { margin: 0 }',
    );
  });

  it("keeps a document start that says more as a condition, with the envelope inside it", () => {
    expect(scope("html.dark .a { color: white }")).toBe(
      'html.dark assembly-root[data-name="cart"] .a { color: white }',
    );
    expect(scope(":root[data-theme=dark] .a { color: white }")).toBe(
      ':root[data-theme=dark] assembly-root[data-name="cart"] .a { color: white }',
    );
  });

  it("reads :host() as the envelope carrying what it names", () => {
    expect(scope(":host(.on) .a { color: red }")).toBe(
      'assembly-root[data-name="cart"].on .a { color: red }',
    );
  });

  it("scopes @container, and leaves @scope's own :scope to @scope", () => {
    expect(scope("@container (min-width: 1px) { .a { color: red } }")).toContain(
      'assembly-root[data-name="cart"] .a',
    );
    expect(scope("@scope (.card) { :scope { color: red } }")).toBe(
      '@scope (.card) { assembly-root[data-name="cart"] :scope { color: red } }',
    );
  });

  it("leaves keyframes alone however the at-rule is spelled", () => {
    for (const at of ["@KEYFRAMES", "@-webkit-keyframes"]) {
      expect(scope(`${at} p { from { opacity: 0 } }`), at).not.toContain("data-name");
    }
  });

  it("escapes a name that would break out of the attribute selector", () => {
    expect(scopeCss(".a {}", 'x"] , body [y="', "x.css")).toContain(
      'assembly-root[data-name="x\\"] , body [y=\\""] .a',
    );
  });
});
