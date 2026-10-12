// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { OutlineRect } from "./outline-rect.js";

/**
 * The box an assembly takes on the screen, or undefined where it takes none: the smallest that
 * holds the element at the top of what its envelope holds and any words written straight into
 * it, inside its shadow root where it has one.
 *
 * Measured from what the envelope holds, because an envelope is an element the browser knows
 * nothing of and lays out as a run of text: around a block, the box it answers for itself is
 * the whole line the block stands in, the block's margins with it. The envelope's own boxes
 * are taken only where it holds nothing that takes room. And only the top of what it holds is
 * measured, so a menu its assembly keeps off the screen does not stretch the box to the menu.
 */
export function envelopeRect(envelope: Element): OutlineRect | undefined {
  const held: DOMRect[] = [];
  const range = envelope.ownerDocument.createRange();
  for (const holder of [envelope, envelope.shadowRoot]) {
    for (const child of holder?.childNodes ?? []) {
      if (child.nodeType === child.ELEMENT_NODE) {
        held.push((child as Element).getBoundingClientRect());
      } else if (child.nodeType === child.TEXT_NODE) {
        range.selectNodeContents(child);
        held.push(...range.getClientRects());
      }
    }
  }
  const takesRoom = (box: DOMRect): boolean => box.width > 0 || box.height > 0;
  const drawn = held.some(takesRoom)
    ? held.filter(takesRoom)
    : [...envelope.getClientRects()].filter(takesRoom);
  if (drawn.length === 0) return undefined;
  const left = Math.min(...drawn.map((box) => box.left));
  const top = Math.min(...drawn.map((box) => box.top));
  return {
    left,
    top,
    width: Math.max(...drawn.map((box) => box.right)) - left,
    height: Math.max(...drawn.map((box) => box.bottom)) - top,
  };
}
