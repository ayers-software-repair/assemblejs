// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { sveltePlacements } from "@assemblejs/cli";

const component = (markup: string, imported = "slot"): string =>
  `<script lang="ts">\n  import { ${imported} } from "@assemblejs/renderer-svelte/client";\n  let { data } = $props();\n  const unused = "slot('in-a-script')";\n</script>\n${markup}\n<style>\n  .x::after { content: "slot('in-a-style')"; }\n</style>`;

describe("the slots a Svelte component's markup places", () => {
  it("are every call of the renderer's slot() outside its script and style", () => {
    expect(
      sveltePlacements(
        component(`<div>{@html slot("cart")}</div><p>{@html slot('price', "compact")}</p>`),
      ),
    ).toEqual({
      placements: [
        { name: "cart", view: "default" },
        { name: "price", view: "compact" },
      ],
      unnamed: [],
    });
  });

  it("leave a computed view out, and report a computed name as it is written", () => {
    const read = sveltePlacements(
      component('{@html slot("price", data.view)}{@html slot(data.which)}'),
    );
    expect(read.placements).toEqual([{ name: "price" }]);
    expect(read.unnamed).toEqual(["slot(data.which)"]);
  });

  it("follow the name the script imports it under, and read none without the import", () => {
    expect(
      sveltePlacements(component('{@html place("cart")}', "slot as place")).placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    // Under a namespace it is the same slot, and a name that only ends like it is another's.
    const whole = `<script lang="ts">\n  import * as c from "@assemblejs/renderer-svelte/client";\n</script>\n<div>{@html c.slot("cart")}{@html abc.slot("price")}{@html c_slot("gone")}</div>`;
    expect(sveltePlacements(whole).placements).toEqual([{ name: "cart", view: "default" }]);
    expect(sveltePlacements('<div>{@html slot("cart")}</div>').placements).toEqual([]);
  });
});
