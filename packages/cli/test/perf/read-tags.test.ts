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
});
