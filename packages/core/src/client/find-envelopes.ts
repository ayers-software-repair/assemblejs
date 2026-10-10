// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

/**
 * Every envelope under a root, in document order, those inside a shadow root included.
 *
 * Document order is nesting order, so a parent is taken before what it holds, and that is the
 * order their mounting is scheduled in. It is not the order they hydrate in: each hydrates when
 * its own module arrives, and either order is right, because a parent writes nothing where a
 * child stands.
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
