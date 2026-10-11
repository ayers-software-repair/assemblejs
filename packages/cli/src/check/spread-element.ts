// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "./computed-marker.js";
import type { ViewElement } from "./view-element.js";

/**
 * Whether the view spreads an object onto the element, which may hold any attribute the reader
 * cannot see: computed, with no attribute of its own standing as the marker, which is how every
 * reader writes a spread. A rule that reads an element for an attribute leaves such an element
 * to the render.
 */
export function spreadElement(element: ViewElement): boolean {
  return element.computed && ![...element.attributes.values()].includes(COMPUTED_MARKER);
}
