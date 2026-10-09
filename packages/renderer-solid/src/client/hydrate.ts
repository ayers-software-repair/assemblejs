// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer, JsonObject, MountContext } from "@assemblejs/core/client";
import { createComponent, sharedConfig } from "solid-js";
import type { Component } from "solid-js";
import { hydrate as hydrateInto } from "solid-js/web";
import type { AssemblyProps } from "../props/assembly-props.js";
import { EventsContext } from "./events-context.js";

/**
 * Turns a Solid component into the browser half of a renderer: it adopts the markup the server
 * sent by its hydration keys, prefixed with this placement's id as the server half prefixed them,
 * in the envelope or the assembly's own shadow root, and the handle disposes everything it
 * created.
 *
 * Solid keeps its hydration state on `globalThis._$HY`, which its own page bootstrap creates with
 * an inline script the page's policy refuses, and marks hydration done (there, and on its shared
 * configuration) after the first hydration or the first delegated event, after which it would
 * re-render rather than adopt. Each assembly mounts on its own and at its own time, so each gets
 * a fresh state of its own.
 */
export function hydrate(component: Component<AssemblyProps>): ClientRenderer {
  return {
    mount(element: Element | ShadowRoot, data: JsonObject, context: MountContext) {
      (globalThis as { _$HY?: unknown })._$HY = {
        events: [],
        completed: new WeakSet(),
        r: {},
        fe: () => undefined,
        done: false,
      };
      sharedConfig.done = false;
      // The nodes another island has not claimed yet (a lazy part still loading) stay claimable:
      // hydrating this one replaces the registry, so they are carried over into it, even when
      // this hydration throws. A node no longer in the page stays behind, so a placement mounted
      // again adopts its fresh markup and nothing an unmounted island left is kept.
      const previous = sharedConfig.registry;
      let dispose: () => void;
      try {
        dispose = hydrateInto(
          () =>
            createComponent(EventsContext.Provider, {
              value: context.events,
              get children() {
                return createComponent(component, { data, children: {} });
              },
            }),
          element,
          { renderId: context.id },
        );
      } catch (error) {
        // Solid ends hydration for the whole page on a mismatch; this island failing does not
        // end it for the others still waiting on a lazy part.
        sharedConfig.done = false;
        throw error;
      } finally {
        for (const [key, node] of previous ?? []) {
          if (node.isConnected) sharedConfig.registry?.set(key, node);
        }
      }
      return { unmount: () => dispose() };
    },
  };
}
