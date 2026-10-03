// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createComponent } from "solid-js";
import type { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

/**
 * Places a child assembly's already-rendered HTML.
 *
 * It is inserted verbatim, which is the single exception in the whole boundary and is safe for
 * one reason: this html was produced by the composer from another assembly's own renderer, not
 * by anything a visitor supplied. Nothing else in a Solid assembly may use `innerHTML`.
 */
export function Slot(props: {
  readonly children: Readonly<Record<string, string>>;
  readonly name: string;
}): JSX.Element {
  return createComponent(Dynamic, {
    component: "div",
    get "data-assembly-slot"() {
      return props.name;
    },
    get innerHTML() {
      return props.children[props.name] ?? "";
    },
  });
}
