// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { vueElements } from "@asmjs/check";

const shown = (source: string) =>
  vueElements(source).map((element) => ({
    tag: element.tag,
    attributes: [...element.attributes],
    computed: element.computed,
  }));

describe("the elements a Vue component's template writes", () => {
  it("reads the template as markup, a bound attribute as the attribute computed, a directive as nothing", () => {
    const source = `<script setup lang="ts">const src = "a.png";</script>
<template>
  <img :src="src" alt="" />
  <input v-model="who" type="text" @input="changed" v-if="shown" />
  <p>{{ greeting }}</p>
  <button v-bind="props">go</button>
</template>`;
    expect(shown(source)).toEqual([
      {
        tag: "img",
        attributes: [
          ["src", COMPUTED_MARKER],
          ["alt", ""],
        ],
        computed: true,
      },
      { tag: "input", attributes: [["type", "text"]], computed: false },
      { tag: "p", attributes: [], computed: false },
      { tag: "button", attributes: [[COMPUTED_MARKER, true]], computed: true },
    ]);
  });

  it("reads an interpolation inside an attribute as the attribute computed", () => {
    const [img] = vueElements('<template><img alt="{{ label }}" src="a.png" /></template>');
    expect(img?.attributes.get("alt")).toBe(COMPUTED_MARKER);
    expect(img?.computed).toBe(true);
  });

  it("reads a component with no template as writing no element", () => {
    expect(vueElements("<script setup>const n = 1</script>")).toEqual([]);
  });
});
