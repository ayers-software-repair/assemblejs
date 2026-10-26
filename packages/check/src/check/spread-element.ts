// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import type { ViewElement } from "./view-element.js";

/**
 * Whether the view spreads an object onto the element, which may hold any attribute the reader
 * cannot see. A reader that meets a spread says so, with the marker as an attribute's name; one
 * that cannot tell says the element is computed and writes no attribute as the marker. A rule
 * that reads an element for an attribute leaves either to the render.
 *
 * Told by the second alone, an element with a spread and a computed attribute beside it was
 * read as having no spread, and held to an attribute its spread may carry.
 */
export function spreadElement(element: ViewElement): boolean {
  if (!element.computed) return false;
  return (
    element.attributes.has(COMPUTED_MARKER) ||
    ![...element.attributes.values()].includes(COMPUTED_MARKER)
  );
}
