// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer, JsonObject, MountContext } from "@assemblejs/core/client";
import type { Component } from "svelte";
import { hydrate as hydrateSvelte, unmount } from "svelte";

/**
 * Turns a Svelte component into the browser half of a renderer.
 *
 * The events object arrives as a prop rather than through a context, because that is Svelte's
 * own idiom: an author reads it the way they read any other prop. The React renderer uses a
 * context for the same reason. Neither wraps the other's habits.
 */
export function hydrate(component: unknown): ClientRenderer {
  return {
    mount(element: Element, data: JsonObject, context: MountContext) {
      const instance = hydrateSvelte(component as Component<Record<string, unknown>>, {
        target: element as HTMLElement,
        props: { data, children: {}, events: context.events },
      });
      return { unmount: () => void unmount(instance) };
    },
  };
}
