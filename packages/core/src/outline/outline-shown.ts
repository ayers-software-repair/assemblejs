// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const KEY = "assemblejs:outline";

/**
 * Whether this visitor has the outline drawn, and with `next`, their choice kept: in the
 * browser's own storage for the origin, so it holds from page to page and reaches no server.
 * It is off until a visitor turns it on, and where storage is refused the choice lasts as long
 * as the page does.
 */
export function outlineShown(page: Document, next?: boolean): boolean {
  try {
    const storage = page.defaultView?.localStorage;
    if (next === undefined) return storage?.getItem(KEY) === "on";
    storage?.setItem(KEY, next ? "on" : "off");
  } catch {
    // A page that may not use storage still draws its outline when asked to.
  }
  return next === true;
}
