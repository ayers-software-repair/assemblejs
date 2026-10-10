// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { Slot } from "@assemblejs/renderer-vue/client";

const render = (name: string, view?: string) =>
  renderToString(
    createSSRApp({ render: () => h(Slot, view === undefined ? { name } : { name, view }) }),
  );

describe("placing a child assembly", () => {
  it("writes the directive the composer replaces, inside the slot's element", async () => {
    expect(await render("inner")).toBe(
      '<div data-assembly-slot="inner"><assembly name="inner"></assembly></div>',
    );
    expect(await render("price", "compact")).toContain(
      '<assembly name="price" view="compact"></assembly>',
    );
  });

  it("writes what the composer reads as exactly that placement", async () => {
    expect(findPlacements(await render("price", "compact"))).toMatchObject([
      { name: "price", view: "compact" },
    ]);
  });

  // The one place a Vue assembly writes markup it did not escape writes only the directive.
  it("refuses a name that is not a segment, rather than write it as markup", async () => {
    await expect(render('x"><script>alert(1)</script>')).rejects.toThrow(
      /not a usable url segment/,
    );
  });
});
