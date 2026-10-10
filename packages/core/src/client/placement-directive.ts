// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { PLACEMENT_ELEMENT } from "../vocab/placement-element.js";
import { SEGMENT } from "../vocab/segment.js";

/**
 * The directive that places an assembly, as markup: what a page or a template view writes by
 * hand, and what a framework view's Slot writes for it. One definition, so every renderer's
 * Slot writes exactly what the composer reads.
 *
 * It goes into a view raw, the one place a framework view writes markup it did not escape. So
 * it is built from segments alone: a name or a view that is not one throws here, and never
 * becomes markup.
 */
export function placementDirective(name: string, view?: string): string {
  for (const [what, value] of [
    ["name", name],
    ["view", view],
  ] as const) {
    if (value !== undefined && !SEGMENT.test(value)) {
      throw new Error(
        `a placement's ${what} "${value}" is not a usable url segment: lower case, a letter first, then letters, digits and hyphens`,
      );
    }
  }
  const attributes = view === undefined ? `name="${name}"` : `name="${name}" view="${view}"`;
  return `<${PLACEMENT_ELEMENT} ${attributes}></${PLACEMENT_ELEMENT}>`;
}
