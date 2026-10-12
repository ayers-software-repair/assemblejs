// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import type { OutlineRect } from "./outline-rect.js";

/**
 * The box an assembly takes on the screen, or undefined where it takes none: the smallest that
 * holds the element at the top of what its envelope holds and any words written straight into
 * it, inside its shadow root where it has one.
 *
 * Measured from what the envelope holds, because an envelope is an element the browser knows
 * nothing of and lays out as a run of text: around a block, the box it answers for itself is
 * the whole line the block stands in, the block's margins with it. So is the box of anything
 * else laid out that way, an assembly placed at the top of another's view among them, and each
 * of those is measured by what it holds in its turn. An element's own boxes are taken only
 * where it holds nothing that takes room. And only the top of what an assembly shows is
 * measured, so a menu it keeps off the screen does not stretch the box to the menu.
 */
export function envelopeRect(envelope: Element): OutlineRect | undefined {
  const drawn = boxesOf(envelope, envelope.ownerDocument.createRange());
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

const takesRoom = (box: DOMRect): boolean => box.width > 0 || box.height > 0;

/** The boxes of what an element laid out as a run of text holds, or its own where it holds none. */
function boxesOf(element: Element, range: Range): DOMRect[] {
  const held: DOMRect[] = [];
  for (const holder of [element, element.shadowRoot]) {
    for (const child of holder?.childNodes ?? []) {
      if (child.nodeType === child.TEXT_NODE) {
        range.selectNodeContents(child);
        held.push(...range.getClientRects());
      } else if (child.nodeType === child.ELEMENT_NODE) {
        const inner = child as Element;
        held.push(...(runsAsText(inner) ? boxesOf(inner, range) : [inner.getBoundingClientRect()]));
      }
    }
  }
  const drawn = held.filter(takesRoom);
  return drawn.length > 0 ? drawn : [...element.getClientRects()].filter(takesRoom);
}

/**
 * Whether an element's own box is a line's and not its own: an envelope, or anything else laid
 * out as a run of text, or with no box at all, that holds elements or a root of its own.
 */
function runsAsText(element: Element): boolean {
  if (element.localName === ENVELOPE_ELEMENT) return true;
  if (element.childElementCount === 0 && element.shadowRoot === null) return false;
  const display = element.ownerDocument.defaultView?.getComputedStyle(element).display;
  return display === "inline" || display === "contents";
}
