// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { markRemote } from "@assemblejs/core";

const envelope = '<assembly-root data-name="cart" data-id="1"><p>x</p></assembly-root>';
const origin = "https://a.example.com";

describe("stamping a remote's answer with its origin", () => {
  it("adds the origin to the envelope, encoded", () => {
    expect(markRemote(envelope, origin)).toEqual({
      html: '<assembly-root data-remote="https://a.example.com" data-name="cart" data-id="1"><p>x</p></assembly-root>',
    });
    expect(markRemote(envelope, 'https://a"b')).toMatchObject({
      html: expect.stringContaining('data-remote="https://a&quot;b"'),
    });
  });

  it("replaces an origin the answer named itself, so it can never claim the page's", () => {
    const claimed =
      '<assembly-root data-remote="https://page.example" data-name="c"></assembly-root>';
    expect(markRemote(claimed, origin)).toEqual({
      html: '<assembly-root data-remote="https://a.example.com" data-name="c"></assembly-root>',
    });
  });

  it("stamps every envelope inside the answer, not only the outer one", () => {
    const nested = `<assembly-root data-name="a"><assembly-root data-name="b"></assembly-root></assembly-root>`;
    const marked = markRemote(nested, origin);
    expect(
      "html" in marked && marked.html.match(/data-remote="https:\/\/a\.example\.com"/g),
    ).toHaveLength(2);
  });

  it("links a stylesheet named by a path from the remote's root from the remote's origin", () => {
    const shadow = `<assembly-root data-name="p"><template shadowrootmode="open"><link rel="stylesheet" href="/s/p.css"><link rel="stylesheet" href='https://cdn.example/x.css'><link href=//cdn.example/y.css></template></assembly-root>`;
    const marked = markRemote(shadow, origin);
    expect("html" in marked && marked.html).toContain(
      '<link rel="stylesheet" href="https://a.example.com/s/p.css">',
    );
    expect("html" in marked && marked.html).toContain("href='https://cdn.example/x.css'");
    expect("html" in marked && marked.html).toContain("href=//cdn.example/y.css");
  });

  it("reads a root path as the browser does, padded or quoted, and keeps it in its attribute", () => {
    for (const [href, expected] of [
      ['" /a.css"', 'href="https://a.example.com/a.css"'],
      ['"\n/a.css "', 'href="https://a.example.com/a.css"'],
      ['"\u0001/a.css"', 'href="https://a.example.com/a.css"'],
      [`'/a".css'`, 'href="https://a.example.com/a&quot;.css"'],
    ] as const) {
      const marked = markRemote(
        `<assembly-root data-name="p"><link rel="stylesheet" href=${href}></assembly-root>`,
        origin,
      );
      expect("html" in marked && marked.html, href).toContain(expected);
    }
  });

  it("refuses an answer that is not one envelope, and says why", () => {
    for (const html of [
      "<p>x</p>",
      '<assembly-root data-name="a">',
      `${envelope}<script>window.injected = 1</script>${envelope}`,
      `<assembly-root></div><img src=x></assembly-root>`,
    ]) {
      expect(markRemote(html, origin)).toMatchObject({ refused: expect.any(String) });
    }
  });
});
