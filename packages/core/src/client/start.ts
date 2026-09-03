// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findEnvelopes } from "./find-envelopes.js";
import type { MountedAssembly } from "./mounted-assembly.js";
import { readIsland } from "./read-island.js";
import { readMountMode } from "./read-mount-mode.js";
import type { Runtime } from "./runtime.js";
import { scheduleMount } from "./schedule-mount.js";
import type { StartOptions } from "./start-options.js";

/**
 * Starts the page's one runtime.
 *
 * It finds every envelope, reads and removes each island, and mounts each assembly through its
 * renderer's browser half. Nothing here knows any framework: the whole cross-framework contract
 * is one mount call and the handle it returns.
 *
 * One assembly failing is one assembly failing. A missing renderer, a malformed island or a
 * mount that throws leaves that assembly as the markup the server sent and lets every other one
 * mount, because a page where one broken island takes the rest down is a page that would have
 * been better off with no runtime at all.
 */
export function start(options: StartOptions): Runtime {
  const mounted = new Map<string, MountedAssembly>();
  const cancels: Array<() => void> = [];

  const mount = (root: ParentNode): void => {
    for (const element of findEnvelopes(root)) {
      const id = element.getAttribute("data-id");
      if (id === null || mounted.has(id)) continue;

      const payload = readIsland(element);
      const mode = readMountMode(element);
      if (mode === "none") continue;
      if (payload === undefined) continue;

      const rendererName = element.getAttribute("data-renderer") ?? "";
      const renderer = Object.hasOwn(options.renderers, rendererName)
        ? options.renderers[rendererName]
        : undefined;
      if (renderer === undefined) {
        console.warn(
          `assemblejs: no browser renderer registered for "${rendererName}", so the assembly ` +
            `"${payload.name}" was left as the markup the server sent`,
        );
        continue;
      }

      cancels.push(
        scheduleMount(element, mode, () => {
          try {
            const handle = renderer.mount(element, payload.data, {
              id: payload.id,
              name: payload.name,
              view: payload.view,
            });
            mounted.set(id, {
              id,
              name: payload.name,
              view: payload.view,
              element,
              handle,
            });
          } catch (error) {
            console.error(`assemblejs: "${payload.name}" did not mount`, error);
          }
        }),
      );
    }
  };

  mount(options.root ?? document);

  return {
    mounted,
    mount,
    unmountAll: () => {
      for (const cancel of cancels.splice(0).reverse()) cancel();
      // Reverse order, so an inner assembly is torn down before the outer one whose markup it
      // is living inside.
      for (const assembly of [...mounted.values()].reverse()) {
        try {
          assembly.handle.unmount();
        } catch (error) {
          console.error(`assemblejs: "${assembly.name}" did not unmount`, error);
        }
      }
      mounted.clear();
    },
  };
}
