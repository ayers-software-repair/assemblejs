// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer, JsonObject, MountContext } from "@assemblejs/core/client";
import { h, hydrate as hydrateInto, render } from "preact";
import type { AssemblyProps } from "../props/assembly-props.js";
import { EventsContext } from "./events-context.js";

/**
 * Turns a Preact component into the browser half of a renderer.
 *
 * `mount` receives the element already resolved, or the assembly's own shadow root, and returns
 * a handle the runtime calls; unmounting renders nothing into the same container.
 */
export function hydrate(component: (props: AssemblyProps) => unknown): ClientRenderer {
  return {
    mount(element: Element | ShadowRoot, data: JsonObject, context: MountContext) {
      hydrateInto(
        h(EventsContext.Provider, { value: context.events }, h(component as never, { data })),
        element,
      );
      return { unmount: () => render(null, element) };
    },
  };
}
