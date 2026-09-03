// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The element the server emits around every fragment: `<assembly-root data-name="cart" …>`.
 *
 * A real custom element, so it takes the hyphen the standard requires. It is the styling scope
 * hook, the hydration hook, and the element a renderer's `mount` receives, which is what every
 * framework already calls a root. It is deliberately not the element an author writes in a
 * template: a placement is nested by definition and a served fragment is not.
 */
export const ENVELOPE_ELEMENT = "assembly-root";
