// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { templateRenderer } from "@assemblejs/renderer-templates";

describe("the renderer for one template language", () => {
  it("claims that language's extension", () => {
    expect(templateRenderer("nunjucks")).toMatchObject({ name: "nunjucks", extensions: [".njk"] });
  });

  it("renders through the interface core defines, its template being its source", async () => {
    const html = await templateRenderer("ejs").render({
      template: "<p><%= data.n %></p>",
      data: { n: 2 },
      children: {},
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toBe("<p>2</p>");
  });
});
