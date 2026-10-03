// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TEMPLATE_RENDERERS, rendererForView } from "@assemblejs/cli";

describe("the template renderers", () => {
  it("are the five languages, each the renderer its extension declares", () => {
    expect(TEMPLATE_RENDERERS).toEqual(["ejs", "handlebars", "markdown", "nunjucks", "pug"]);
    expect(["a.ejs", "a.hbs", "a.md", "a.njk", "a.pug"].map(rendererForView)).toEqual(
      TEMPLATE_RENDERERS,
    );
  });
});
