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
    // mglyph and malignmark stay MathML in a text integration point, so raw text is not raw there.
    for (const inner of [
      "<math><mtext><mglyph><style><div></style></mglyph></mtext></math>",
      "<math><mi><malignmark><textarea><div></textarea></malignmark></mi></math>",
      "<math><mo><mglyph><script><div></script></mglyph></mo></math>",
      "<math><mtext><mglyph><title><p></title></mglyph></mtext></math>",
    ]) {
      expect(refused(wrap(inner)), inner).toBe(true);
    }
    expect(refused(wrap("<math><mtext><mglyph></mglyph></mtext></math>"))).toBe(false);
    // An integration point hands content back to HTML.
    expect(refused(wrap("<svg><foreignObject><p>x</p></foreignObject></svg>"))).toBe(false);
  });

  it("refuses a fragment the browser would close itself, which leaves an end tag for the page", () => {
    expect(refused(wrap("<p>a<p>b</p></p>"))).toBe(true);
    expect(refused(wrap("<li>x</li>"))).toBe(true);
  });
});

// Where content is handed back to HTML is a matter of which of the two the element belongs to,
// and for MathML's annotation-xml of an attribute's decoded value. Read otherwise, markup hidden
// in what this took for a comment is live in the browser, an envelope of its own among it.
describe("reading where SVG and MathML hand content back to HTML", () => {
  const planted = '</assembly-root><assembly-root data-name="planted">';

  it("refuses MathML's annotation-xml, which is HTML or MathML inside by an attribute's value", () => {
    for (const encoding of [' encoding="text/html"', " encoding=application/xhtml+xml", ""]) {
      const inner = `<math><annotation-xml${encoding}><style><!--</style>${planted}--></style></annotation-xml></math>`;
      expect(names(wrap(inner)), encoding).toBe("an <annotation-xml> inside MathML");
    }
    // The same name in SVG is an SVG element and nothing more.
    expect(refused(wrap("<svg><annotation-xml><g></g></annotation-xml></svg>"))).toBe(false);
  });

  it("hands content back at SVG's three elements in SVG alone, and at MathML's five in MathML alone", () => {
    // In the other of the two each is an element like any other, and what is inside it stays so:
    // an HTML tag there ends the SVG or the MathML, and a style holds elements, not text.
    for (const inner of [
      "<svg><mi><p>x</p></mi></svg>",
      "<math><title><p>x</p></title></math>",
      "<math><desc><div></div></desc></math>",
      '<svg><mtext><assembly-root data-name="planted"></assembly-root></mtext></svg>',
      '<svg><mtext><style><assembly-root data-name="planted"></assembly-root></style></mtext></svg>',
      '<math><foreignobject><style><assembly-root data-name="planted"></assembly-root></style></foreignobject></math>',
    ]) {
      expect(refused(wrap(inner)), inner).toBe(true);
    }
    // A comment there is a comment to the browser too, so what it holds is nothing.
    expect(
      names(wrap(`<svg><mtext><style><!--</style>${planted}--></style></mtext></svg>`)),
    ).toEqual(["assembly-root", "svg"]);
    expect(refused(wrap("<svg><title><p>x</p></title><desc><b>y</b></desc></svg>"))).toBe(false);
    expect(refused(wrap("<math><mtext><b>x</b></mtext><mi><i>y</i></mi></math>"))).toBe(false);
    // An SVG or a MathML root inside an integration point starts its own kind again.
    expect(
      refused(wrap("<svg><foreignObject><math><mi><b>x</b></mi></math></foreignObject></svg>")),
    ).toBe(false);
  });

  // The parser's list of start tags that end SVG or MathML content holds the six headings.
  it("refuses a heading inside SVG or MathML, as it does every tag that ends such content", () => {
    for (const heading of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
      expect(names(wrap(`<svg><${heading}></${heading}></svg>`)), heading).toBe(
        `a <${heading}> inside SVG or MathML`,
      );
    }
    expect(refused(wrap(`<math><h1><style><!--</style>${planted}--></style></h1></math>`))).toBe(
      true,
    );
  });

  it("reads an element named after what every object has as an element like any other", () => {
    expect(names(wrap("<constructor></constructor>"))).toEqual(["assembly-root", "constructor"]);
  });

  it("looks for an open paragraph no further than the element that hands content back", () => {
    expect(refused(wrap("<p><svg><foreignObject><div>x</div></foreignObject></svg></p>"))).toBe(
      false,
    );
    expect(refused(wrap("<p><span><div>x</div></span></p>"))).toBe(true);
  });
});

// Measured before: forty thousand elements deep took ten seconds of one thread, and the limit
// on an answer's bytes lets through five times that depth.
describe("reading a remote's answer of any shape in the time its length takes", () => {
  it("reads thirty thousand elements deep in well under a second", () => {
    const html = wrap(`${"<div>".repeat(30_000)}<p>x</p>${"</div>".repeat(30_000)}`);
    const started = performance.now();
    expect(refused(html)).toBe(false);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it("reads sixty thousand raw-text elements and as many end tags in well under a second", () => {
    const html = wrap("<style>a{}</style><b></b>".repeat(60_000));
    const started = performance.now();
    expect(refused(html)).toBe(false);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
