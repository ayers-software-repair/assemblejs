// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isStaticView } from "@assemblejs/cli";

describe("whether a view is server markup and nothing more", () => {
  it("is for plain html and every template language", () => {
    for (const renderer of ["html", "ejs", "handlebars", "markdown", "nunjucks", "pug"]) {
      expect(isStaticView(renderer), renderer).toBe(true);
    }
  });

  it("is not for a framework, whose view hydrates", () => {
    for (const renderer of ["lit", "preact", "react", "solid", "svelte", "vue"]) {
      expect(isStaticView(renderer), renderer).toBe(false);
    }
  });
});
