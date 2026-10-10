// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readViewPlacements } from "@assemblejs/cli";

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

  it("reads a template in its language, nothing from Markdown, and leaves Pug to the render", () => {
    expect(
      readViewPlacements("card.ejs", "ejs", '<assembly name="cart"></assembly><%= data.x %>')
        .placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    expect(
      readViewPlacements("notes.md", "markdown", '<assembly name="cart"/>').placements,
    ).toEqual([]);
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
