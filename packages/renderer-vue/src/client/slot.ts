// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineComponent, h } from "vue";
import type { PropType } from "vue";

/**
 * Places a child assembly's already-rendered HTML.
 *
 * It is inserted verbatim, which is the single exception in the whole boundary and is safe for
 * one reason: this html was produced by the composer from another assembly's own renderer, not
 * by anything a visitor supplied. Nothing else in a Vue assembly may use `innerHTML`.
 */
export const Slot = defineComponent({
  name: "AssemblySlot",
  props: {
    children: { type: Object as PropType<Readonly<Record<string, string>>>, required: true },
    name: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h("div", { "data-assembly-slot": props.name, innerHTML: props.children[props.name] ?? "" });
  },
});
