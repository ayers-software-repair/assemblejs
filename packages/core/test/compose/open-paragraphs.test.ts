// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { openParagraphs } from "@assemblejs/core";

const inside = (template: string) => openParagraphs(template)(template.indexOf("|"));

describe("where a template stands inside a paragraph the parser has not closed", () => {
  it("is after a <p> with no end, whatever inline elements stand between, in any case", () => {
    expect(inside("<p>text |")).toBe(true);
    expect(inside('<P class="x">text <span>in</span> |')).toBe(true);
    expect(inside("<p>a</p><p>b |")).toBe(true);
    expect(inside("<p>one <p>two |")).toBe(true);
  });

  it("is not after </p>, after a start tag that closes a paragraph, or after the end of a block above", () => {
    expect(inside("<p>text</p> |")).toBe(false);
    expect(inside("<p>text<div> |")).toBe(false);
    expect(inside("<p>text<h2>heading |")).toBe(false);
    expect(inside("<section><p>text</section> |")).toBe(false);
    expect(inside("<li><p>text</li> |")).toBe(false);
    expect(inside("<main>|")).toBe(false);
    expect(inside("|<p>later")).toBe(false);
  });

  it("reads no tag inside a comment or a raw-text element", () => {
    expect(inside("<!-- <p> --> |")).toBe(false);
    expect(inside("<script>'<p>'</script> |")).toBe(false);
    expect(inside("<p><!-- </p> --> |")).toBe(true);
  });

  it("is one pass, so ten thousand points are answered as fast as one", () => {
    const template = "<p>a</p>".repeat(10000) + "<div>|";
    const started = performance.now();
    const open = openParagraphs(template);
    for (let at = 0; at < template.length; at += 7) open(at);
    expect(open(template.indexOf("|"))).toBe(false);
    expect(performance.now() - started).toBeLessThan(2000);
  });
});
