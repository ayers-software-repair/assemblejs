// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { placementDirective } from "@assemblejs/core/client";
import { createComponent } from "solid-js";
import type { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

/**
 * Places a child assembly: writes the directive the composer replaces with the child's envelope.
 *
 * It writes the same markup on the server and in the browser. On the server the composer puts
 * the child where the directive stood; in the browser Solid leaves what a slot holds alone,
 * while it hydrates and for as long as the directive it is given does not change.
 *
 * This is the one place a Solid assembly writes markup it did not escape, and what it writes is
 * only the directive, built from a name and a view. Nothing else in a Solid assembly may use
 * `innerHTML`.
 */
export function Slot(props: { readonly name: string; readonly view?: string }): JSX.Element {
  return createComponent(Dynamic, {
    component: "div",
    get "data-assembly-slot"() {
      return props.name;
    },
    get innerHTML() {
      return placementDirective(props.name, props.view);
    },
  });
}
