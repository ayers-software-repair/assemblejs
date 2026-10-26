// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { loadPug } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { templateElements } from "@asmjs/check";

const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));

describe("the elements a template view writes", () => {
  it("reads a plain html view as written, and a template with what it computes marked", () => {
    expect(templateElements("html", '<img src="a.png" alt="A">')?.map((e) => e.tag)).toEqual([
      "img",
    ]);
    const [img] =
      templateElements("ejs", '<img src="<%= data.src %>" alt="<%= data.alt %>">') ?? [];
    expect(img?.computed).toBe(true);
    expect(img?.attributes.has("alt")).toBe(true);
  });

  it("reads markdown as writing no element, and leaves what it cannot read as markup to the render", () => {
    expect(templateElements("markdown", "# Heading\n\n![alt](a.png)")).toEqual([]);
    expect(templateElements("pug", "img(src='a.png')")).toBeUndefined();
    expect(templateElements("react", "export default () => null;")).toBeUndefined();
  });

  // Found 2026-10-11: a Pug view was read as elements with no attributes at all.
  it("reads a Pug view's elements with the attributes it writes, through the project's own Pug", () => {
    const pug = loadPug(templates);
    const source = [
      "section.story",
      '  img(src="cup.png" alt="A stoneware cup")',
      '  input#q(aria-label="Search the shop")',
      '  p(style="color:red") styled inline',
      "  img(alt=data.caption)",
    ].join("\n");
    const elements = templateElements("pug", source, pug) ?? [];
    expect(elements.map((element) => element.tag)).toEqual(["section", "img", "input", "p", "img"]);
    const [section, img, input, styled, captioned] = elements;
    expect(section?.attributes.get("class")).toBe("story");
    expect(img?.attributes.get("alt")).toBe("A stoneware cup");
    expect(input?.attributes.get("aria-label")).toBe("Search the shop");
    expect(input?.attributes.get("id")).toBe("q");
    expect(styled?.attributes.get("style")).toBe("color:red");
    expect(captioned?.attributes.has("alt")).toBe(true);
    expect(captioned?.computed).toBe(true);
  });
});
