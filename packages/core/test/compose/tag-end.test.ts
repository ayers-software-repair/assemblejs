// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { tagEnd } from "@assemblejs/core";

/** What follows the tag a piece of markup opens with, read from just past its name. */
const after = (html: string): string =>
  html.slice(tagEnd(html, /^<\/?[a-zA-Z][^\t\n\f\r />]*/.exec(html)?.[0].length ?? 0));

describe("where a tag ends", () => {
  it("is just past its closing angle bracket, with or without attributes", () => {
    expect(after("<div>X")).toBe("X");
    expect(after('<div class="a" hidden>X')).toBe("X");
    expect(after("<br/>X")).toBe("X");
    expect(after("<input disabled />X")).toBe("X");
    expect(after("</div >X")).toBe("X");
  });

  // An angle bracket inside a quoted value is the value's text, whichever quote holds it.
  it("is not an angle bracket inside a quoted value", () => {
    expect(after('<div title="a > b">X')).toBe("X");
    expect(after("<div title='a > b'>X")).toBe("X");
    expect(after(`<div title="it's > that" lang='"en>"'>X`)).toBe("X");
    expect(after('<div title = "a > b" >X')).toBe("X");
  });

  it("ends a value written without quotes at white space or the bracket, as the tokenizer does", () => {
    expect(after("<a href=/x/y>X")).toBe("X");
    expect(after('<a title=x"y>X">Z')).toBe('X">Z');
    expect(after("<a title=>X")).toBe("X");
    expect(after("<a b/=c>X")).toBe("X");
  });

  it("reads a quote that opens no value as the text it is", () => {
    // After a quoted value with no space, a name begins at once; a quote in a name is the name's.
    expect(after('<a title="x"y"=z>X')).toBe("X");
    expect(after('<a "=b>X">Z')).toBe('X">Z');
  });

  it("is the end of the markup where the tag never ends", () => {
    expect(after('<div title="never closed>X')).toBe("");
    expect(after("<div class")).toBe("");
    expect(after("<div class=")).toBe("");
  });

  it("reads a megabyte of attributes in the time its length takes", () => {
    const html = `<div ${'data-a="<x>" '.repeat(80_000)}>X`;
    const started = performance.now();
    expect(after(html)).toBe("X");
    expect(performance.now() - started).toBeLessThan(500);
  });
});
