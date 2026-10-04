// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readTags } from "@assemblejs/cli";

describe("reading a document's link, script and envelope tags", () => {
  it("reads attributes in any order, however quoted, names lower-cased", () => {
    expect(
      readTags(
        '<LINK href=/a.css REL="stylesheet" /><script src=\'/c.js\' type="module"></script><p>',
      ),
    ).toEqual([
      { tag: "link", attributes: { href: "/a.css", rel: "stylesheet" } },
      { tag: "script", attributes: { src: "/c.js", type: "module" } },
    ]);
  });

  it("decodes character references as the browser does", () => {
    const [link] = readTags('<link rel="stylesheet" href="/a.css?x=1&#x26;y=2&amp;z=&#51;&lt;">');
    expect(link?.attributes["href"]).toBe("/a.css?x=1&y=2&z=3<");
  });

  it("reads an attribute value holding a closing bracket", () => {
    const [envelope] = readTags('<assembly-root data-name="a>b" data-failed="1">');
    expect(envelope?.attributes).toEqual({ "data-name": "a>b", "data-failed": "1" });
  });

  it("turns a numeric reference no character answers into U+FFFD rather than throwing", () => {
    const [link] = readTags('<link href="/a&#x110000;b&#0;c&#xD800;.css">');
    expect(link?.attributes["href"]).toBe("/a\uFFFDb\uFFFDc\uFFFD.css");
  });

  it("reads no tag inside a comment or inside a script's or a style's text", () => {
    const html = [
      '<!-- <link rel="stylesheet" href="/commented.css"> -->',
      "<script>document.write('<script src=\"/written.js\"></scr' + 'ipt>')</script>",
      '<style>/* <link href="/styled.css"> */</style>',
      '<script type="module" src="/real.js"></script>',
    ].join("");
    expect(readTags(html)).toEqual([
      { tag: "script", attributes: {} },
      { tag: "script", attributes: { type: "module", src: "/real.js" } },
    ]);
  });

  it("does not take a custom element for the element its name begins with", () => {
    const html =
      '<title-bar>Hi</title-bar><script-loader src="/no.js"></script-loader>' +
      '<script type="module" src="/a.js"></script><assembly-root data-name="cart" data-failed="1">';
    expect(readTags(html)).toEqual([
      { tag: "script", attributes: { type: "module", src: "/a.js" } },
      { tag: "assembly-root", attributes: { "data-name": "cart", "data-failed": "1" } },
    ]);
  });

  it("ends a comment where a browser does, and reads nothing a noscript or template holds", () => {
    const html =
      '<!--><link rel="stylesheet" href="/after-empty.css"><!--->' +
      '<noscript><link rel="stylesheet" href="/noscript.css"></noscript>' +
      '<template><script type="module" src="/inert.js"></script></template>';
    expect(readTags(html)).toEqual([
      { tag: "link", attributes: { rel: "stylesheet", href: "/after-empty.css" } },
    ]);
  });

  it("reads what a template declaring a shadow root holds, as the browser attaches it", () => {
    const html =
      '<assembly-root data-name="box"><template shadowrootmode="open">' +
      '<link rel="stylesheet" href="/box.shadow.css"><p>box</p></template></assembly-root>';
    expect(readTags(html)).toEqual([
      { tag: "assembly-root", attributes: { "data-name": "box" } },
      { tag: "link", attributes: { rel: "stylesheet", href: "/box.shadow.css" } },
    ]);
  });
});
