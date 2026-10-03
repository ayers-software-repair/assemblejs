// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { scanFragment } from "@assemblejs/core";

const wrap = (inner: string): string => `<assembly-root data-name="a">${inner}</assembly-root>`;
const refused = (html: string): boolean => typeof scanFragment(html) === "string";
const names = (html: string): readonly string[] | string => {
  const tags = scanFragment(html);
  return typeof tags === "string" ? tags : tags.map((tag) => tag.name);
};

describe("reading a remote's answer as the browser will", () => {
  it("answers every start tag in order, nested envelopes included, with where each sits", () => {
    const html = wrap('<div><assembly-root data-name="b"></assembly-root></div>');
    expect(names(html)).toEqual(["assembly-root", "div", "assembly-root"]);
    const found = scanFragment(html);
    expect(Array.isArray(found) && found.map((tag) => tag.start)).toEqual([0, 29, 34]);
  });

  it("reads what the renderers emit", () => {
    // React's text separators, Svelte's hydration markers and empty comments, an island, SVG.
    const markup =
      '<p>a<!-- -->b</p><!--[--><!----><!--]--><svg viewBox="0 0 1 1"><path d="M0"/><title>t</title></svg>' +
      "<ul><li>x</li></ul><table><tbody><tr><td>1</td></tr></tbody></table><br><input disabled>" +
      '<template shadowrootmode="open"><link rel="stylesheet" href="/s.css"></template>' +
      '<script type="application/json" data-assembly="a">{"a":"\\u003c/script>"}</script>';
    expect(Array.isArray(scanFragment(`\n${wrap(markup)}\n`))).toBe(true);
  });

  it("does not see tags inside attribute values, comments or raw text", () => {
    const found = names(
      wrap(
        '<p title="<assembly-root>"><!-- <assembly-root> --></p><style>.a::after{content:"<assembly-root>"}</style><textarea><assembly-root></textarea>',
      ),
    );
    expect(found).toEqual(["assembly-root", "p", "style", "textarea"]);
  });

  it("refuses anything around the envelope", () => {
    for (const html of [
      `x${wrap("")}`,
      `${wrap("")}x`,
      `${wrap("")}${wrap("")}`,
      `<!-- c -->${wrap("")}`,
      "<p></p>",
      "",
      "<!doctype html>",
    ]) {
      expect(refused(html), html).toBe(true);
    }
  });

  it("refuses an end tag that would close something in the page", () => {
    for (const inner of [
      "</div>",
      "</p>",
      "<b></i></b>",
      "<div></span></div>",
      "<b></i>",
      "<div></p>",
      "</ assembly-root>",
    ]) {
      expect(refused(wrap(inner)), inner).toBe(true);
    }
  });

  it("refuses comments and raw text the browser ends somewhere else", () => {
    for (const inner of [
      "<!-->",
      // The browser ends this comment at once; a reader looking for the next "-->" would not.
      "<!---><b>x<!-- -->",
      "<!-- a --!><b>-->",
      "<!-- open",
      "<script><!--<script></script>",
      "<script>open",
      "<style>a</style x>",
      "<![CDATA[x]]>",
      "<?x?>",
    ]) {
      expect(refused(wrap(inner)), inner).toBe(true);
    }
  });

  it("refuses elements that act on the page around the fragment", () => {
    for (const inner of [
      "<body>",
      "<html>",
      "<head>",
      // Closed or not: the browser reads everything after it as text, the page included.
      "<plaintext></plaintext>",
      "<iframe></iframe>",
      "<noscript></noscript>",
    ]) {
      expect(refused(wrap(inner)), inner).toBe(true);
    }
  });

  it("follows SVG and MathML: self-closing tags close, HTML tags inside them are refused", () => {
    expect(refused(wrap("<svg/><p>after</p>"))).toBe(false);
    expect(refused(wrap("<math><mi>x</mi></math>"))).toBe(false);
    expect(refused(wrap("<svg><p>x</p></svg>"))).toBe(true);
    expect(refused(wrap('<svg><font color="red"></font></svg>'))).toBe(true);
    expect(refused(wrap("<svg><style></svg><div></style></svg>"))).toBe(true);
    expect(refused(wrap("<svg><assembly-root></assembly-root></svg>"))).toBe(true);
    // An integration point hands content back to HTML.
    expect(refused(wrap("<svg><foreignObject><p>x</p></foreignObject></svg>"))).toBe(false);
  });

  it("refuses a fragment the browser would close itself, which leaves an end tag for the page", () => {
    expect(refused(wrap("<p>a<p>b</p></p>"))).toBe(true);
    expect(refused(wrap("<li>x</li>"))).toBe(true);
  });
});
