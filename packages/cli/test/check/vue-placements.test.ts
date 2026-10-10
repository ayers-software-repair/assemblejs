// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { vuePlacements } from "@assemblejs/cli";

const component = (template: string, imported = "Slot"): string =>
  `<script setup lang="ts">\nimport { ${imported} } from "@assemblejs/renderer-vue/client";\nconst view = "compact";\n</script>\n\n<template>\n  <section>${template}</section>\n</template>`;

describe("the slots a Vue component's template places", () => {
  it("are every Slot it writes, with the name and the view written as strings", () => {
    expect(
      vuePlacements(component('<Slot name="cart" /><Slot name="price" view="compact"></Slot>')),
    ).toEqual({
      placements: [
        { name: "cart", view: "default" },
        { name: "price", view: "compact" },
      ],
      unnamed: [],
    });
  });

  it("leave a bound view out, and report a bound or a missing name as it is written", () => {
    const read = vuePlacements(
      component(
        '<Slot name="price" :view="view" /><Slot :name="which" /><Slot v-bind:name="which" />',
      ),
    );
    expect(read.placements).toEqual([{ name: "price" }]);
    expect(read.unnamed).toEqual(['<Slot :name="which" />', '<Slot v-bind:name="which" />']);
  });

  it("follow the name the script imports it under, never the native slot outlet", () => {
    expect(vuePlacements(component('<Place name="cart" />', "Slot as Place")).placements).toEqual([
      { name: "cart", view: "default" },
    ]);
    expect(vuePlacements(component('<slot name="cart" />')).placements).toEqual([]);
  });
});
