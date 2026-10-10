// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

/**
 * Every envelope under a root, in document order, those inside a shadow root included.
 *
 * Document order matters and is not incidental: it is nesting order, so an outer assembly
 * mounts before an inner one and the inner one mounts into markup the outer already treated as
 * an opaque child. Mounting inner-first hands the outer framework a subtree another framework
 * is already driving.
 *
 * A selector does not cross into a shadow root, and an assembly rendered inside one may have
 * placed children there. So the walk enters each shadow root where it stands: the root's own,
 * and that of every element under it, an envelope's or not.
 */
export function findEnvelopes(root: ParentNode): Element[] {
  const found: Element[] = [];
  const enter = (scope: ParentNode): void => {
    for (const element of scope.querySelectorAll("*")) {
      if (element.localName === ENVELOPE_ELEMENT) found.push(element);
      if (element.shadowRoot !== null) enter(element.shadowRoot);
    }
  };
  if (root instanceof Element && root.shadowRoot !== null) enter(root.shadowRoot);
  enter(root);
  return found;
}
