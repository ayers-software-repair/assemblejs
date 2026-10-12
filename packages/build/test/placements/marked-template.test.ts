// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPUTED_MARKER, markedTemplate } from "@assemblejs/build";

describe("a template's source as markup", () => {
  it("stands the marker where EJS, Handlebars and Nunjucks compute, and leaves the rest", () => {
    expect(markedTemplate("ejs", '<p class="<%= tone %>"><%- data.note %></p>', undefined)).toBe(
      `<p class="${COMPUTED_MARKER}">${COMPUTED_MARKER}</p>`,
    );
    expect(markedTemplate("handlebars", "<p>{{{raw}}} {{safe}}</p>", undefined)).toBe(
      `<p>${COMPUTED_MARKER} ${COMPUTED_MARKER}</p>`,
    );
    expect(
      markedTemplate("nunjucks", "{% if x %}<p>{{ y }}</p>{# c #}{% endif %}", undefined),
    ).toBe(`${COMPUTED_MARKER}<p>${COMPUTED_MARKER}</p>${COMPUTED_MARKER}${COMPUTED_MARKER}`);
  });

  it("is a plain html view's own source, and nothing for a renderer that is no template, or Pug with no Pug", () => {
    expect(markedTemplate("html", "<p>as written</p>", undefined)).toBe("<p>as written</p>");
    expect(markedTemplate("react", "export default () => null;", undefined)).toBeUndefined();
    expect(markedTemplate("pug", "p hi", undefined)).toBeUndefined();
  });
});
