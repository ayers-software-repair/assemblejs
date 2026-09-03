// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer, JsonObject, MountContext } from "@assemblejs/core/client";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import type { AssemblyProps } from "../props/assembly-props.js";
import { EventsContext } from "./events-context.js";

/**
 * Turns a React component into the browser half of a renderer.
 *
 * `mount` receives the element already resolved and returns a handle the runtime calls. An
 * adapter that looked its own root up would no-op silently when the lookup missed, which is the
 * predecessor's defect: nothing appeared and nothing said why.
 */
export function hydrate(component: (props: AssemblyProps) => unknown): ClientRenderer {
  return {
    mount(element: Element, data: JsonObject, context: MountContext) {
      const root = hydrateRoot(
        element,
        createElement(
          EventsContext.Provider,
          { value: context.events },
          createElement(component as never, { data, children: {} }),
        ),
      );
      return { unmount: () => root.unmount() };
    },
  };
}
