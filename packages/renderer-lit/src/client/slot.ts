// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { placementDirective } from "@assemblejs/core/client";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

/**
 * Places a child assembly: writes the directive the composer replaces with the child's envelope,
 * for a view to put in its template as `${slot("cart")}`.
 *
 * The same directive on the server and in the browser, so the template Lit hydrates is the one
 * it rendered. This is the one thing a Lit view writes unescaped: the directive, built from a
 * name and a view.
 *
 * A Lit view may hold a Lit assembly, at any depth beneath it, only behind a shadow root: the
 * assembly's own, which `export const shadow = true` in its view gives it. Lit hydrates a view
 * by reading every marker in its tree, and one left in the same tree is refused when the view
 * mounts.
 */
export function slot(name: string, view?: string): ReturnType<typeof unsafeHTML> {
  return unsafeHTML(placementDirective(name, view));
}
