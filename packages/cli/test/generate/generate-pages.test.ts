// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generatePages } from "@assemblejs/cli";

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
    expect(source).toContain('import template_home from "../src/pages/home/home.html";');
    expect(source).toContain('import page_shop from "../src/pages/shop/shop.page.js";');
    expect(source).toContain('{ route: "/", template: template_home },');
    expect(source).toContain('{ route: "/shop", ...page_shop, template: template_shop },');
    expect(source).toContain("GENERATED");
  });
});
