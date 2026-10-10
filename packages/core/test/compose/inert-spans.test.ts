// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { inertSpans } from "@assemblejs/core";

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
});
