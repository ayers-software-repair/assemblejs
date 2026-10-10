// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findEnvelopes } from "@assemblejs/core/client";

// What Lit's hydration reads a comment as one of its own markers by.
const MARKER = /^\/?lit-(?:part|node)/;

/**
 * The assembly placed in a view's own tree whose markup carries Lit's hydration markers, when
 * there is one: the innermost envelope around the first such marker.
 *
 * Lit hydrates a view by reading every marker in its tree, down to each shadow root. A marker
 * inside another assembly's envelope is that assembly's, and Lit reads it as the view's own: it
 * throws when the marker binds an attribute, and otherwise takes the assembly's nodes for its
 * own and removes them the next time the view renders. A shadow root hides what is inside it,
 * so an assembly behind one, its own or another's, is never answered here.
 */
export function litAssemblyInTree(container: Element | ShadowRoot): Element | undefined {
  const placed = new Set(findEnvelopes(container));
  if (placed.size === 0) return undefined;
  const comments = container.ownerDocument.createTreeWalker(container, NodeFilter.SHOW_COMMENT);
  for (let comment = comments.nextNode(); comment !== null; comment = comments.nextNode()) {
    if (!MARKER.test((comment as Comment).data)) continue;
    for (
      let around = comment.parentElement;
      around !== null && around !== container;
      around = around.parentElement
    ) {
      if (placed.has(around)) return around;
    }
  }
  return undefined;
}
