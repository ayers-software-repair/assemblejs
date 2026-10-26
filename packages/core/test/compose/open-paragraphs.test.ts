// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { openParagraphs } from "@asmjs/core";

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

  // The parser closes a paragraph at these too, and a page that placed after one was refused.
  it("is not after a list item, a description's part or a form begun inside the paragraph", () => {
    expect(inside("<ul><li><p>one<li> |")).toBe(false);
    expect(inside("<dl><dt><p>term<dd> |")).toBe(false);
    expect(inside("<dl><dd><p>said<dt> |")).toBe(false);
    expect(inside("<p>text<form> |")).toBe(false);
  });

  // A form begun inside a form is ignored by the parser, and closes nothing.
  it("is still after a form the parser ignores, one begun inside another", () => {
    expect(inside("<form><p>text<form> |")).toBe(true);
    expect(inside("<form></form><p>text<form> |")).toBe(false);
  });

  // A table closes a paragraph only in a document that is not in quirks mode, which is known
  // of a template that opens with the doctype and of no other.
  it("is not after a table in a document that says it is HTML, and is where nothing says so", () => {
    expect(inside("<!doctype html><p>text<table><tr><td> |")).toBe(false);
    expect(inside("<!DOCTYPE HTML>\n<html><body><p>text<table> |")).toBe(false);
    expect(inside("<p>text<table><tr><td> |")).toBe(true);
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
