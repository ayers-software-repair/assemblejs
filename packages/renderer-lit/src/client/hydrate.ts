// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer, JsonObject, MountContext } from "@assemblejs/core/client";
import { hydrate as hydrateLit } from "@lit-labs/ssr-client";
// Lit's template layer, never `lit` itself: the browser half must not load Lit's element base
// before the view does, or that base registers with Lit's hydration support before this package
// has adapted it.
import { nothing, render } from "lit/html.js";
import type { LitView } from "../props/lit-view.js";
import { litAssemblyInTree } from "./lit-assembly-in-tree.js";

/**
 * Turns a Lit view into the browser half of a renderer: the template the server rendered is
 * hydrated in place, in the envelope or the assembly's own shadow root, its property and event
 * bindings set, and each Lit element in it hydrates its own shadow root when it is defined. The
 * handle renders nothing where the view was.
 *
 * A view that holds a Lit assembly in its own tree is refused before Lit reads a marker, by
 * name: Lit would read that assembly's markers as the view's.
 */
export function hydrate(view: LitView): ClientRenderer {
  return {
    mount(element: Element | ShadowRoot, data: JsonObject, context: MountContext) {
      const container = element as HTMLElement;
      const placed = litAssemblyInTree(element);
      if (placed !== undefined) {
        throw new Error(
          `the Lit view of "${context.name}" cannot hold the Lit assembly "${placed.getAttribute("data-name") ?? ""}" in its own tree: Lit hydrates a view by reading every marker under it, and would read that assembly's as this view's own. Give that assembly a shadow root of its own, with \`export const shadow = true\` in its view.`,
        );
      }
      hydrateLit(view({ data, events: context.events }), container);
      return { unmount: () => render(nothing, container) };
    },
  };
}
