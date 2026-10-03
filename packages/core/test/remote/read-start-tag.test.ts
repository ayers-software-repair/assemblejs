// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readStartTag } from "@assemblejs/core";

describe("reading one start tag as the browser's tokenizer does", () => {
  it("reads the name and every attribute, with its source as sent", () => {
    const html = `x<Assembly-Root data-id="1" hidden data-x='a > b' data-y=z>`;
    expect(readStartTag(html, 1)).toEqual({
      name: "assembly-root",
      start: 1,
      end: html.length,
      attributes: [
        { name: "data-id", source: 'data-id="1"' },
        { name: "hidden", source: "hidden" },
        { name: "data-x", source: "data-x='a > b'" },
        { name: "data-y", source: "data-y=z" },
      ],
      selfClosing: false,
    });
  });

  it("knows a self-closing tag", () => {
    expect(readStartTag("<path d='M0'/>", 0)).toMatchObject({ name: "path", selfClosing: true });
  });

  it("refuses what the browser only accepts as an error, and a tag cut off", () => {
    for (const html of [
      "<p",
      '<a"b>',
      '<p title="open>',
      '<p a"b=1>',
      "<p a=b'c>",
      "<p a= >",
      "<p / a>",
      '<p ="x">',
    ]) {
      expect(typeof readStartTag(html, 0), html).toBe("string");
    }
  });
});
