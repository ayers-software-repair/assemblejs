// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { templateElements } from "@assemblejs/cli";

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
});
