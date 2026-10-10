// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer, JsonObject, MountContext } from "@assemblejs/core/client";
import { createSSRApp } from "vue";
import type { Component } from "vue";
import { EVENTS_KEY } from "./events-key.js";

/**
 * Turns a Vue component into the browser half of a renderer: an app of its own, created for
 * hydration, mounted on the markup the server sent in the envelope or the assembly's own shadow
 * root. The handle unmounts that app.
 */
export function hydrate(component: Component): ClientRenderer {
  return {
    mount(element: Element | ShadowRoot, data: JsonObject, context: MountContext) {
      const app = createSSRApp(component, { data });
      app.provide(EVENTS_KEY, context.events);
      // Vue's mount takes a shadow root at run time; its type names an element or a selector.
      app.mount(element as Element);
      return { unmount: () => app.unmount() };
    },
  };
}
