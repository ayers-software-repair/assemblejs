// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TEMPLATE_EXTENSIONS } from "@assemblejs/renderer-templates";

describe("the extension that names each template language", () => {
  it("is the one its own tooling uses", () => {
    expect(TEMPLATE_EXTENSIONS).toEqual({
      ejs: ".ejs",
      handlebars: ".hbs",
      markdown: ".md",
      nunjucks: ".njk",
      pug: ".pug",
    });
  });
});
