// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TEMPLATE_EXTENSIONS } from "@assemblejs/renderer-templates";
import type { TemplateEngine } from "@assemblejs/renderer-templates";

describe("the template languages", () => {
  it("are the five this package renders", () => {
    const engines: readonly TemplateEngine[] = ["ejs", "handlebars", "markdown", "nunjucks", "pug"];
    expect(Object.keys(TEMPLATE_EXTENSIONS).sort()).toEqual(engines);
  });
});
