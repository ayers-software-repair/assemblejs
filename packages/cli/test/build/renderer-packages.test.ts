// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RENDERER_PACKAGES, TEMPLATE_RENDERERS } from "@assemblejs/cli";

describe("the renderers a build can wire", () => {
  it("names each by the renderer a view declares, and plain html needs none", () => {
    for (const [name, known] of Object.entries(RENDERER_PACKAGES)) {
      expect(known.name).toBe(name);
      expect(known.package).toBe(
        TEMPLATE_RENDERERS.includes(name)
          ? "@assemblejs/renderer-templates"
          : `@assemblejs/renderer-${name}`,
      );
      expect(known.template === true).toBe(TEMPLATE_RENDERERS.includes(name));
    }
    expect(Object.hasOwn(RENDERER_PACKAGES, "html")).toBe(false);
  });

  // Svelte and Vue views are compiled by the compiler the project installed, so it must have one.
  it("names the framework itself for the two a build compiles with the project's own compiler", () => {
    expect(
      Object.values(RENDERER_PACKAGES).flatMap(({ name, compiler }) =>
        compiler === undefined ? [] : [[name, compiler]],
      ),
    ).toEqual([
      ["svelte", "svelte"],
      ["vue", "vue"],
    ]);
  });

  it("renders every template language through the one templates package", () => {
    for (const name of ["ejs", "handlebars", "markdown", "nunjucks", "pug"]) {
      expect(RENDERER_PACKAGES[name]).toEqual({
        name,
        package: "@assemblejs/renderer-templates",
        template: true,
      });
    }
  });
});
