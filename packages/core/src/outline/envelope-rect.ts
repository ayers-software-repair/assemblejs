// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { OutlineRect } from "./outline-rect.js";

/**
 * The box an assembly takes on the screen, or undefined where it takes none: the smallest that
 * holds the envelope's own boxes, the element at the top of what it holds and any words written
 * straight into it, inside its shadow root where it has one.
 *
 * Measured and not asked of the envelope alone, because an envelope is an element the browser
 * knows nothing of and lays out as a run of text: around a block it has no box worth the name.
 * Only the top of what it holds is measured, so a menu its assembly keeps off the screen does
 * not stretch the box to where the menu is.
 */
export function envelopeRect(envelope: Element): OutlineRect | undefined {
  const boxes: DOMRect[] = [...envelope.getClientRects()];
  const range = envelope.ownerDocument.createRange();
  for (const holder of [envelope, envelope.shadowRoot]) {
    for (const child of holder?.childNodes ?? []) {
      if (child.nodeType === child.ELEMENT_NODE) {
        boxes.push((child as Element).getBoundingClientRect());
      } else if (child.nodeType === child.TEXT_NODE) {
        range.selectNodeContents(child);
        boxes.push(...range.getClientRects());
      }
    }
  }
  const drawn = boxes.filter((box) => box.width > 0 || box.height > 0);
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
