// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { placementDirective } from "@assemblejs/core/client";

/**
 * Places a child assembly: answers the directive the composer replaces with the child's
 * envelope, for a component to write with Svelte's own raw form, `{@html slot("cart")}`.
 *
 * The same string on the server and in the browser, so Svelte finds what it rendered when it
 * hydrates and writes nothing again while the name and the view stay the same. This is the one
 * thing a Svelte assembly writes with `{@html}`: the directive, built from a name and a view.
 */
export function slot(name: string, view?: string): string {
  return placementDirective(name, view);
}
