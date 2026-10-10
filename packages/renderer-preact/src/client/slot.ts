// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { placementDirective } from "@assemblejs/core/client";
import { h } from "preact";
import type { ComponentChild } from "preact";

/**
 * Places a child assembly: writes the directive the composer replaces with the child's envelope.
 *
 * It writes the same markup on the server and in the browser. On the server the composer puts
 * the child where the directive stood; in the browser Preact leaves what a slot holds alone,
 * while it hydrates and for as long as the directive it is given does not change.
 *
 * This is the one place a Preact assembly writes markup it did not escape, and what it writes
 * is only the directive, built from a name and a view. Nothing else in a Preact assembly may use
 * dangerouslySetInnerHTML.
 */
export function Slot({
  name,
  view,
}: {
  readonly name: string;
  readonly view?: string;
}): ComponentChild {
  return h("div", {
    "data-assembly-slot": name,
    dangerouslySetInnerHTML: { __html: placementDirective(name, view) },
  });
}
