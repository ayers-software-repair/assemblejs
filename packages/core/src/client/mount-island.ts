// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { IslandPayload } from "../island/island-payload.js";
import type { ClientRenderer } from "./client-renderer.js";
import type { Bus } from "./events/bus.js";
import type { MountHandle } from "./mount-handle.js";

/**
 * Mounts one assembly's browser half, with the events that are its own, and answers its handle
 * and what releases its subscriptions.
 *
 * A mount that throws answers nothing: it is reported against the assembly's name, the assembly
 * stays the markup the server sent, and whatever it had subscribed before it threw is released,
 * so nothing of an assembly that never mounted is left listening on the page's bus.
 *
 * An assembly that opted into Shadow DOM is mounted inside its shadow root, which the browser
 * built from the declarative template the server sent.
 */
export function mountIsland(
  renderer: ClientRenderer,
  element: Element,
  payload: IslandPayload,
  bus: Bus,
): { readonly handle: MountHandle; readonly release: () => void } | undefined {
  const sender = { id: payload.id, name: payload.name, view: payload.view };
  const held = bus.forAssembly(sender);
  try {
    const handle = renderer.mount(element.shadowRoot ?? element, payload.data, {
      ...sender,
      events: held.events,
    });
    return { handle, release: held.release };
  } catch (error) {
    held.release();
    console.error(`assemblejs: "${payload.name}" did not mount`, error);
    return undefined;
  }
}
