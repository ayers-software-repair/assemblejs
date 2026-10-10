// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPug, readViewPlacements } from "@assemblejs/cli";

const pug = loadPug(fileURLToPath(new URL("../../../../examples/templates/", import.meta.url)));

describe("what a view's source says it places, each kind of view by what it is", () => {
  it("reads a plain html view as a page's template is read, and throws as its render would", () => {
    expect(
      readViewPlacements("shell.html", "html", '<section><assembly name="cart"/></section>')
        .placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    expect(() => readViewPlacements("shell.html", "html", '<assembly nam="cart"/>')).toThrow(
      /unknown attribute/,
    );
  });

  it("reads a template in its language, Pug with the project's own, and nothing from Markdown", () => {
    expect(
      readViewPlacements("card.ejs", "ejs", '<assembly name="cart"></assembly><%= data.x %>')
        .placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    expect(
      readViewPlacements("notes.md", "markdown", '<assembly name="cart"/>').placements,
    ).toEqual([]);
    expect(readViewPlacements("card.pug", "pug", 'assembly(name="cart")', pug).placements).toEqual([
      { name: "cart", view: "default" },
    ]);
    // With no Pug to read it, a project that has not installed its renderer, it is unread.
    expect(
      readViewPlacements("card.pug", "pug", 'assembly(name="cart")').placements,
    ).toBeUndefined();
  });

  it("reads a framework view by the slots it writes", () => {
    const client = (framework: string) => `@assemblejs/renderer-${framework}/client`;
    expect(
      readViewPlacements(
        "shell.react.tsx",
        "react",
        `import { Slot } from "${client("react")}";\nexport default () => <Slot name="cart" />;`,
      ).placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    expect(
      readViewPlacements(
        "shell.lit.ts",
        "lit",
        `import { slot } from "${client("lit")}";\nexport default () => slot("cart");`,
      ).placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    expect(
      readViewPlacements(
        "shell.svelte",
        "svelte",
        `<script>import { slot } from "${client("svelte")}";</script>{@html slot("cart")}`,
      ).placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    expect(
      readViewPlacements(
        "shell.vue",
        "vue",
        `<script setup>import { Slot } from "${client("vue")}";</script><template><Slot name="cart" /></template>`,
      ).placements,
    ).toEqual([{ name: "cart", view: "default" }]);
  });

  it("answers none known for a module it cannot compile, and leaves it to the build to say why", () => {
    expect(readViewPlacements("shell.react.tsx", "react", "export default <").placements).toBe(
      undefined,
    );
  });
});
