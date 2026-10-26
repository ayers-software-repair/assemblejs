// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { inertSpans } from "@asmjs/core";

/** Whether the first "TAG" written in the markup falls where the parser reads text. */
const inertAt = (html: string): boolean => inertSpans(html)(html.indexOf("TAG"));

describe("where markup is text the parser never reads as tags", () => {
  it("is inside a comment, and inside a script, style, textarea or title", () => {
    expect(inertAt("<!-- TAG -->")).toBe(true);
    expect(inertAt("<!--\n  TAG\n-->")).toBe(true);
    for (const element of ["script", "style", "textarea", "title", "SCRIPT"]) {
      expect(inertAt(`<${element} type="x">TAG</${element}>`), element).toBe(true);
    }
  });

  it("is nowhere else: before, between and after those stretches the markup is live", () => {
    expect(inertAt("<p>TAG</p>")).toBe(false);
    expect(inertAt("TAG<!-- later -->")).toBe(false);
    expect(inertAt("<!-- a -->TAG<!-- b -->")).toBe(false);
    expect(inertAt("<script>a</script>TAG<style>b</style>")).toBe(false);
    // An element whose name only starts like one of them is an ordinary element.
    expect(inertAt("<scripts>TAG</scripts>")).toBe(false);
  });

  // Each stretch is consumed whole before the next is looked for. Matched on their own, the
  // script a comment mentions opened a stretch that ran to the next real end tag and hid
  // every live tag between.
  it("reads a script named inside a comment as the comment's text, opening nothing", () => {
    expect(inertAt("<!-- <script> -->TAG<script>later</script>")).toBe(false);
    expect(inertAt("<script>// <!-- </script>TAG<!-- -->")).toBe(false);
  });

  it("ends a comment whose closing dashes are its opening ones, as the parser does", () => {
    expect(inertAt("<!-->TAG<!-- later -->")).toBe(false);
    expect(inertAt("<!--->TAG<!-- later -->")).toBe(false);
  });

  it("runs to the end when a comment or a raw-text element is never closed", () => {
    expect(inertAt("<!-- TAG")).toBe(true);
    expect(inertAt("<textarea>TAG")).toBe(true);
  });

  // A tag's name ends at a space, a slash or the tag's end, never at a hyphen. Read as ending at
  // one, each of these opened a stretch no end tag closed, and everything after it was text.
  it("reads an element whose name goes on past a raw-text element's as an ordinary element", () => {
    for (const element of ["title-bar", "style-guide", "script-runner", "textarea-autosize"]) {
      expect(inertAt(`<${element}>TAG</${element}>`), element).toBe(false);
      expect(inertAt(`<${element} mode="x"></${element}><p>TAG</p>`), element).toBe(false);
    }
    expect(inertAt("<title\n>TAG</title>")).toBe(true);
    expect(inertAt("<script/>TAG</script>")).toBe(true);
  });

  it("ends a raw-text element at its end tag, whatever that tag holds after its name", () => {
    expect(inertAt("<script>a</script foo>TAG")).toBe(false);
    expect(inertAt("<style>a</style\n>TAG")).toBe(false);
    expect(inertAt("<textarea>a</TEXTAREA/>TAG")).toBe(false);
    // An end tag whose name only starts like the element's is the element's text.
    expect(inertAt("<title>a</title-bar>TAG</title>")).toBe(true);
  });

  // What a tag holds between its name and its end is its attributes, and no value of one is
  // markup: a comment's opening written in a title is the title.
  it("is inside a tag, among its attributes, whatever a value of one looks like", () => {
    expect(inertAt('<div title="TAG">x</div>')).toBe(true);
    expect(inertAt("<div title='<p> TAG'>x</div>")).toBe(true);
    expect(inertAt("<div data-x=TAG>x</div>")).toBe(true);
    expect(inertAt('</div title="TAG">')).toBe(true);
    for (const opener of ["<!--", "<script>", "<style>", "<textarea>", "<title>"]) {
      expect(inertAt(`<div title="${opener}">x</div>TAG`), opener).toBe(false);
      expect(inertAt(`<div title='${opener}'>x</div>TAG`), opener).toBe(false);
    }
    // And the text after the tag is live again, a bracket in a value having ended nothing.
    expect(inertAt('<div title="a > b">TAG</div>')).toBe(false);
  });

  // Measured before: sixteen thousand scripts took a second, and twice as many four times that.
  it("reads a template of sixty thousand raw-text elements in the time its length takes", () => {
    const html = `${"<script>1</script><style>a{}</style>".repeat(30_000)}TAG`;
    const started = performance.now();
    const inert = inertSpans(html);
    let hidden = 0;
    for (let at = 0; at < html.length; at += 7) if (inert(at)) hidden += 1;
    expect(inert(html.indexOf("TAG"))).toBe(false);
    expect(hidden).toBeGreaterThan(100_000);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
