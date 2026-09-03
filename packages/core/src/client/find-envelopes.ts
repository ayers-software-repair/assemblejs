// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

/**
 * Every envelope under a root, in document order.
 *
 * Document order matters and is not incidental: it is nesting order, so an outer assembly
 * mounts before an inner one and the inner one mounts into markup the outer already treated as
 * an opaque child. Mounting inner-first hands the outer framework a subtree another framework
 * is already driving.
 */
export function findEnvelopes(root: ParentNode): Element[] {
  return [...root.querySelectorAll(ENVELOPE_ELEMENT)];
}
