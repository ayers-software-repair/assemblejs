// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generatePages } from "@assemblejs/build";

describe("generating the pages the built server imports", () => {
  it("joins each template to its declaration, the declaration's route winning", () => {
    const source = generatePages(
      [
        {
          name: "home",
          route: "/",
          template: "/p/src/pages/home/home.html",
          declaration: undefined,
        },
        {
          name: "shop",
          route: "/shop",
          template: "/p/src/pages/shop/shop.html",
          declaration: "/p/src/pages/shop/shop.page.ts",
        },
      ],
      "/p/.assemblejs",
    );
    expect(source).toContain(
      '// @ts-ignore: not TypeScript, and read by the build\nimport template_home from "../src/pages/home/home.html";',
    );
    expect(source).toContain('import page_shop from "../src/pages/shop/shop.page.js";');
    expect(source).not.toContain("@ts-ignore: not TypeScript, and read by the build\nimport page_");
    expect(source).toContain('{ route: "/", template: template_home },');
    expect(source).toContain('{ route: "/shop", ...page_shop, template: template_shop },');
    expect(source).toContain("GENERATED");
    expect(source).not.toContain("notFound");
  });

  it("exports the not-found page apart, with no route, and leaves it out of the routed pages", () => {
    const source = generatePages(
      [
        {
          name: "home",
          route: "/",
          template: "/p/src/pages/home/home.html",
          declaration: undefined,
        },
        {
          name: "not-found",
          route: "/not-found",
          template: "/p/src/pages/not-found/not-found.html",
          declaration: "/p/src/pages/not-found/not-found.page.ts",
        },
      ],
      "/p/.assemblejs",
    );
    expect(source).toContain(
      'export const notFound: Omit<PageDefinition, "route"> = { ...page_not_found, template: template_not_found };',
    );
    expect(source).toContain(
      'import page_not_found from "../src/pages/not-found/not-found.page.js";',
    );
    expect(source).not.toContain('/not-found"');
    expect(source).toContain('[\n  { route: "/", template: template_home },\n];');
  });
});
