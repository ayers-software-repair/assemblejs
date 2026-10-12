// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EnvelopeFacts } from "./envelope-facts.js";
import type { OutlineRect } from "./outline-rect.js";

/**
 * What an outline draws for one envelope: a frame around the assembly, and a note at its corner
 * that names it and opens to say the rest.
 */
export interface OutlineBox {
  /** The frame, which takes no clicks: the page beneath it is used as it always is. */
  readonly frame: HTMLElement;
  /** The chip and the card it opens. */
  readonly note: HTMLElement;
  /** Writes what is said of the envelope, where it has changed. */
  readonly tell: (facts: EnvelopeFacts) => void;
  /** How much room the note takes: as wide as it is now, open or shut, and as tall as its chip. */
  readonly room: () => { readonly width: number; readonly height: number };
  /** Draws the frame around a box and the note at a place, or hides both where there is none. */
  readonly move: (around: OutlineRect | undefined, note: OutlineRect | undefined) => void;
}
