// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { IslandPayload } from "../island/island-payload.js";

/**
 * Reads an envelope's data island and REMOVES it.
 *
 * Removal is not tidiness. The island is a script element holding a serialised payload; left in
 * the document it is re-read by anything that walks the DOM, re-serialised by anything that
 * snapshots it, and shown by view-source long after the runtime has the value in hand.
 *
 * Returns undefined when there is no island, which is what a static assembly looks like.
 */
export function readIsland(envelope: Element): IslandPayload | undefined {
  const id = envelope.getAttribute("data-id");
  if (id === null) return undefined;
  const script = envelope.querySelector(`script[data-assembly="${CSS.escape(id)}"]`);
  if (script === null) return undefined;

  const text = script.textContent ?? "";
  script.remove();
  try {
    return JSON.parse(text) as IslandPayload;
  } catch {
    // A malformed island is this assembly's problem and nobody else's: the page keeps its
    // server-rendered markup and every other assembly still mounts.
    return undefined;
  }
}
