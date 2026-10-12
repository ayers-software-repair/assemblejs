// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { MOUNTED_ATTRIBUTE } from "../vocab/mounted-attribute.js";
import type { MountHandle } from "./mount-handle.js";

/**
 * Writes the one mark that says an assembly is live, for whatever waits on it, when it is live:
 * at once for a mount that is done when it returns, and for one that says it will be later,
 * when it says so. A mount that says it never will be is left unmarked, and so is an assembly
 * the runtime no longer holds by the time its mount goes live.
 *
 * Written when the handle came back, the mark was on every assembly of a built project before
 * its module had arrived, and stayed on one whose module never did.
 */
export function markMounted(element: Element, handle: MountHandle, held: () => boolean): void {
  if (handle.mounted === undefined) {
    element.setAttribute(MOUNTED_ATTRIBUTE, "");
    return;
  }
  handle.mounted.then(
    () => {
      if (held()) element.setAttribute(MOUNTED_ATTRIBUTE, "");
    },
    // Whoever said it will not be live has said why.
    () => undefined,
  );
}
