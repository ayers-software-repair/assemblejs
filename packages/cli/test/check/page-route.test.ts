// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pageRoute, realIo } from "@assemblejs/cli";

const page = (declaration?: string) => {
  const root = mkdtempSync(join(tmpdir(), "route-"));
  if (declaration !== undefined) realIo.write(join(root, "shop.page.ts"), declaration);
  return {
    root,
    page: {
      name: "shop",
      route: "/shop",
      template: "shop.html",
      declaration: declaration === undefined ? undefined : "shop.page.ts",
    },
  };
};

describe("the route a page answers at", () => {
  it("is the one its directory implies when it declares none", () => {
    const { root, page: discovered } = page();
    expect(pageRoute(root, discovered)).toBe("/shop");
    const { root: other, page: plain } = page("export default { place: {} };");
    expect(pageRoute(other, plain)).toBe("/shop");
  });

  it("is the one its own file declares, through definePage or a name", () => {
    for (const source of [
      'import { definePage } from "@assemblejs/core";\nexport default definePage({ route: "/store" });',
      'const page = { route: "/store" };\nexport default page;',
    ]) {
      const { root, page: declared } = page(source);
      expect(pageRoute(root, declared), source).toBe("/store");
    }
  });

  it("is unknown for a route the file computes", () => {
    const { root, page: computed } = page('const r = "/s" + "tore";\nexport default { route: r };');
    expect(pageRoute(root, computed)).toBeUndefined();
  });
});
