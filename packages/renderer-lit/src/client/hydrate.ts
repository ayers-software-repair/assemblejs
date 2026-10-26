// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ATTRIBUTE, findEnvelopes } from "@asmjs/core/client";
import type { ClientRenderer, JsonObject, MountContext } from "@asmjs/core/client";
import { hydrate as hydrateLit } from "@lit-labs/ssr-client";
// Lit's template layer, never `lit` itself: the browser half must not load Lit's element base
// before the view does, or that base registers with Lit's hydration support before this package
// has adapted it.
import { nothing, render } from "lit/html.js";
import type { LitView } from "../props/lit-view.js";
import { litAssemblyInTree } from "./lit-assembly-in-tree.js";

// Lit's mark on an element that is not to hydrate yet.
const DEFERRED = "defer-hydration";

/**
 * Turns a Lit view into the browser half of a renderer: the template the server rendered is
 * hydrated in place, in the envelope or the assembly's own shadow root, its property and event
 * bindings set, and each Lit element in it hydrates its own shadow root when it is defined. The
 * handle renders nothing where the view was.
 *
 * The server marks each element the view holds to wait for this (`defer-hydration`), so none
 * hydrates from what its constructor set before the view has set what it renders from. Lit lets
 * go of an element as it sets what the view binds to it, and of no other, so the ones the view
 * binds nothing to are let go here, once the view has hydrated. An element inside another's
 * shadow root is that element's to let go, which Lit does as it hydrates.
 *
 * A view that holds a Lit assembly in its own tree is refused before Lit reads a marker, by
 * name: Lit would read that assembly's markers as the view's.
 */
export function hydrate<D extends JsonObject>(view: LitView<D>): ClientRenderer {
  return {
    mount(element: Element | ShadowRoot, data: JsonObject, context: MountContext) {
      const container = element as HTMLElement;
      const placed = litAssemblyInTree(element);
      if (placed !== undefined) {
        throw new Error(
          `the Lit view of "${context.name}" cannot hold the Lit assembly "${placed.getAttribute(ENVELOPE_ATTRIBUTE.name) ?? ""}" in its own tree: Lit hydrates a view by reading every marker under it, and would read that assembly's as this view's own. Give that assembly a shadow root of its own, with \`export const shadow = true\` in its view.`,
        );
      }
      // What the island carried, which the view's author says is D.
      hydrateLit(view({ data: data as D, events: context.events }), container);
      // The view's own elements, and not those of an assembly it places, which are that
      // assembly's view's to let go.
      const children = findEnvelopes(element);
      for (const held of container.querySelectorAll(`[${DEFERRED}]`)) {
        if (!children.some((child) => child.contains(held))) held.removeAttribute(DEFERRED);
      }
      return { unmount: () => render(nothing, container) };
    },
  };
}
