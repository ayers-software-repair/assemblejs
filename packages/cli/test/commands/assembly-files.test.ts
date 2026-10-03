// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { assemblyFiles } from "@assemblejs/cli";

describe("what a new assembly is made of", () => {
  it("names the view file so its framework is visible from a directory listing", () => {
    expect(Object.keys(assemblyFiles("cart", "svelte") ?? {})).toEqual([
      "src/assemblies/cart/cart.svelte",
    ]);
    expect(Object.keys(assemblyFiles("cart", "preact") ?? {})).toEqual([
      "src/assemblies/cart/cart.preact.tsx",
    ]);
    expect(Object.keys(assemblyFiles("cart", "react") ?? {})).toEqual([
      "src/assemblies/cart/cart.react.tsx",
    ]);
  });

  it("writes each view in its own framework's idiom", () => {
    const svelte = Object.values(assemblyFiles("cart-item", "svelte") ?? {})[0] ?? "";
    expect(svelte).toContain("$props()");
    expect(svelte).not.toContain("export default function");
    const react = Object.values(assemblyFiles("cart-item", "react") ?? {})[0] ?? "";
    // A React component's name starts with a capital, or React treats it as an html tag.
    expect(react).toContain("export default function CartItem(");
  });

  it("is one view and nothing to register anywhere", () => {
    expect(Object.keys(assemblyFiles("cart", "html") ?? {})).toEqual([
      "src/assemblies/cart/cart.html",
    ]);
  });

  it("names a template view by its language's own extension, its markup escaping data", () => {
    const files = {
      ejs: "cart.ejs",
      handlebars: "cart.hbs",
      markdown: "cart.md",
      nunjucks: "cart.njk",
      pug: "cart.pug",
    };
    for (const [renderer, file] of Object.entries(files)) {
      expect(Object.keys(assemblyFiles("cart", renderer) ?? {})).toEqual([
        `src/assemblies/cart/${file}`,
      ]);
    }
    expect(Object.values(assemblyFiles("cart", "ejs") ?? {})[0]).toContain("<%= data.title");
  });

  it("is nothing at all for a renderer it does not know", () => {
    expect(assemblyFiles("cart", "angular")).toBeUndefined();
    expect(assemblyFiles("cart", "constructor")).toBeUndefined();
  });
});
