// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import { vueRenderer } from "@assemblejs/renderer-vue";

const Cart = defineComponent({
  props: { data: { type: Object as PropType<Record<string, unknown>>, required: true } },
  setup: (given) => () => h("p", String(given.data["greeting"])),
});

describe("the Vue renderer", () => {
  it("claims .vue, which is Vue's alone", () => {
    expect(vueRenderer.name).toBe("vue");
    expect(vueRenderer.extensions).toEqual([".vue"]);
  });

  it("renders through the interface core defines", async () => {
    const html = await vueRenderer.render({
      template: Cart,
      data: { greeting: "hello" },
      children: {},
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toBe("<p>hello</p>");
  });
});
