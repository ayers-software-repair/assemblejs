// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COMPUTED, UNREAD, discoverPages, readPageShape, realIo } from "@assemblejs/cli";

const TEMPLATE =
  '<main><assembly name="header"></assembly><assembly name="cart" view="compact"></assembly></main>';

const page = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), "page-shape-"));
  for (const [path, contents] of Object.entries(files)) {
    realIo.write(join(root, "src/pages", path), contents);
  }
  const [found] = discoverPages(join(root, "src/pages")).pages;
  if (found === undefined) throw new Error("no page was written");
  return readPageShape(root, found);
};

describe("one page, read from its sources", () => {
  it("is its route and what its template places, in the template's order", () => {
    expect(page({ "shop/shop.html": TEMPLATE })).toEqual({
      name: "shop",
      route: "/shop",
      template: "src/pages/shop/shop.html",
      places: [
        { name: "header", view: "default" },
        { name: "cart", view: "compact" },
      ],
      policy: {},
      stream: null,
    });
  });

  it("is what its declaration writes: the route, each placement's policy and the stream", () => {
    const shape = page({
      "shop/shop.html": TEMPLATE,
      "shop/shop.page.ts":
        'import { definePage } from "@assemblejs/core";\nexport default definePage({ route: "/store", place: { cart: { defer: true, timeout: 800 } }, stream: "/api/prices" });',
    });
    expect(shape).toMatchObject({
      route: "/store",
      declaration: "src/pages/shop/shop.page.ts",
      policy: { cart: { defer: true, timeout: 800 } },
      stream: "/api/prices",
    });
  });

  it("marks what the declaration computes where it stands, and leaves none of it out", () => {
    const shape = page({
      "shop/shop.html": TEMPLATE,
      "shop/shop.page.ts":
        'const ms = 400 * 2;\nconst at = routeFor("store");\nexport default { route: at, place: { cart: { timeout: ms, url: remote("cart"), required: true }, ...more } };',
    });
    expect(shape.route).toBe(COMPUTED);
    expect(shape.policy).toEqual({
      cart: { timeout: COMPUTED, url: COMPUTED, required: true },
      "...": COMPUTED,
    });
    expect(shape.stream).toBeNull();
  });

  it("marks the policy and the stream of a declaration that is computed whole", () => {
    const shape = page({
      "shop/shop.html": TEMPLATE,
      "shop/shop.page.ts": "export default pageFor(process.env);",
    });
    expect(shape).toMatchObject({ policy: COMPUTED, stream: COMPUTED });
  });

  it("says a declaration could not be read, and still tells the rest of the page", () => {
    const shape = page({
      "shop/shop.html": TEMPLATE,
      "shop/shop.page.ts": "export default { route: ",
    });
    expect(shape).toMatchObject({ route: UNREAD, policy: UNREAD, stream: UNREAD });
    expect(shape.places).toHaveLength(2);
    expect(shape.declaration).toBe("src/pages/shop/shop.page.ts");
  });

  it("says a template's placements could not be read, and still tells the rest of the page", () => {
    const shape = page({
      "shop/shop.html": '<main><assembly name="cart" timeout="5"></assembly></main>',
      "shop/shop.page.ts": 'export default { route: "/store" };',
    });
    expect(shape.places).toBe(UNREAD);
    expect(shape.route).toBe("/store");
  });
});
