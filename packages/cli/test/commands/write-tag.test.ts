// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { writeTag } from "@asmjs/cli";

const TAG = "<x-tag></x-tag>";
const CR = String.fromCharCode(13);
/** Writes the tag where a caret stands in a template, laid out like where a second one does. */
const write = (marked: string, deeper = false): string => {
  const at = marked.replace("^", "").indexOf("|");
  const like = marked.replace("|", "").indexOf("^");
  const template = marked.replace("|", "").replace("^", "");
  return writeTag(template, TAG, at, like === -1 ? at : like, deeper);
};

describe("writing a tag into a template", () => {
  it("is a new line beneath, where nothing follows the place on its line", () => {
    expect(write("<ul>\n  <li>a</li>|\n</ul>")).toBe(`<ul>\n  <li>a</li>\n  ${TAG}\n</ul>`);
    // Whitespace that trails the line stays where it was.
    expect(write("  <p>a</p>|  \n")).toBe(`  <p>a</p>  \n  ${TAG}\n`);
    expect(write("<p>a</p>|")).toBe(`<p>a</p>\n${TAG}`);
  });

  it("is a new line above, where nothing comes before the place on its line", () => {
    expect(write("<ul>\n  |<li>a</li>\n</ul>")).toBe(`<ul>\n  ${TAG}\n  <li>a</li>\n</ul>`);
    expect(write("|<p>a</p>")).toBe(`${TAG}\n<p>a</p>`);
  });

  it("is written where it was asked for, with nothing added, between two things on a line", () => {
    expect(write("<p>one |two</p>")).toBe(`<p>one ${TAG}two</p>`);
    expect(write("<b>a</b>|<i>b</i>\n")).toBe(`<b>a</b>${TAG}<i>b</i>\n`);
  });

  it("is indented as the line it is told to be like, and one step further for a first child", () => {
    expect(write("<body>|\n    ^<main></main>\n</body>")).toBe(
      `<body>\n    ${TAG}\n    <main></main>\n</body>`,
    );
    expect(write("<html>\n  <body>|\n  </body>\n</html>", true)).toBe(
      `<html>\n  <body>\n    ${TAG}\n  </body>\n</html>`,
    );
    expect(write("<html>\n\t<body>|\n\t</body>\n</html>", true)).toBe(
      `<html>\n\t<body>\n\t\t${TAG}\n\t</body>\n</html>`,
    );
    // A file that indents nothing has no step to take.
    expect(write("<body>|\n</body>", true)).toBe(`<body>\n${TAG}\n</body>`);
  });

  it("ends its line as the file ends its lines", () => {
    expect(write(`<ul>${CR}\n  <li>a</li>|${CR}\n</ul>${CR}\n`)).toBe(
      `<ul>${CR}\n  <li>a</li>${CR}\n  ${TAG}${CR}\n</ul>${CR}\n`,
    );
    expect(write(`<ul>${CR}\n  |<li>a</li>${CR}\n</ul>`)).toBe(
      `<ul>${CR}\n  ${TAG}${CR}\n  <li>a</li>${CR}\n</ul>`,
    );
  });

  it("leaves a byte order mark first, and makes of an empty template the tag", () => {
    const mark = String.fromCharCode(0xfeff);
    expect(write(`${mark}|<p>a</p>`)).toBe(`${mark}${TAG}\n<p>a</p>`);
    expect(write("|")).toBe(`${TAG}\n`);
    expect(write(" \n|")).toBe(`${TAG}\n`);
    expect(write(`${mark}|`)).toBe(`${mark}${TAG}\n`);
  });
});
