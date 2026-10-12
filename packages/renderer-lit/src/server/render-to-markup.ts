// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject, MarkupInput } from "@assemblejs/core";
import { serverEvents } from "@assemblejs/core/client";
import { render } from "@lit-labs/ssr";
import { collectResultSync } from "@lit-labs/ssr/lib/render-result.js";
import type { LitView } from "../props/lit-view.js";
import { StylelessElementRenderer } from "./styleless-element-renderer.js";

/**
 * Renders a Lit view to the markup the server sends: its template with the markers hydration
 * reads, and every Lit element in it rendered into a declarative shadow root, so the page is
 * whole before any script runs.
 *
 * An element's styles are left out of its shadow root: Lit writes them as an inline `<style>`,
 * which the page's default policy refuses, and the browser half adopts the same styles as
 * constructed sheets when the element hydrates. So an element is styled once it hydrates.
 *
 * Each element the view holds is marked to hydrate only when the view does, which is when the
 * view sets what the element renders from: a view's module defines its elements before the view
 * hydrates, and an element left to hydrate as soon as it is defined renders from what its
 * constructor set, against markup the server rendered from the view's data.
 *
 * It does not catch: a failed render throws, the composer catches it, and the placement falls
 * back. The view renders with the server's events, as it hydrates with the page's.
 */
export function renderToMarkup<D extends JsonObject>(view: LitView<D>, input: MarkupInput): string {
  return collectResultSync(
    // What the assembly's services returned, which its author says is D.
    render(view({ data: input.data as D, events: serverEvents() }), {
      elementRenderers: [StylelessElementRenderer],
      deferHydration: true,
    }),
  );
}
