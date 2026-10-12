// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EnvelopeFacts } from "./envelope-facts.js";
import type { OutlineBox } from "./outline-box.js";
import type { OutlineRect } from "./outline-rect.js";

/**
 * Makes what an outline draws for one envelope. Everything is built as elements and text, and
 * moved by setting single style properties, so nothing an assembly is named or says is ever
 * read as markup, and a page whose policy allows no inline style draws it all the same.
 */
export function createBox(page: Document): OutlineBox {
  const frame = page.createElement("div");
  frame.className = "frame";
  const note = page.createElement("div");
  note.className = "note";
  const chip = page.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.setAttribute("aria-expanded", "false");
  const name = page.createElement("b");
  const brief = page.createElement("span");
  // The space is for whoever hears the chip read out: its two parts are two words.
  chip.append(name, " ", brief);
  const card = page.createElement("dl");
  card.className = "card";
  card.hidden = true;
  note.append(chip, card);
  chip.addEventListener("click", () => {
    card.hidden = !card.hidden;
    chip.setAttribute("aria-expanded", String(!card.hidden));
  });

  let told = "";
  let drawn = "";
  const place = (element: HTMLElement, at: OutlineRect): void => {
    element.style.transform = `translate(${Math.round(at.left)}px, ${Math.round(at.top)}px)`;
  };
  return {
    frame,
    note,
    tell: (facts: EnvelopeFacts) => {
      const next = JSON.stringify(facts);
      if (next === told) return;
      told = next;
      frame.dataset.tone = facts.tone;
      note.dataset.tone = facts.tone;
      name.textContent = facts.name;
      brief.textContent = facts.brief;
      card.replaceChildren(
        ...facts.rows.flatMap(([label, value]) => {
          const term = page.createElement("dt");
          term.textContent = label;
          const said = page.createElement("dd");
          said.textContent = value;
          return [term, said];
        }),
      );
    },
    room: () => ({ width: note.offsetWidth, height: chip.offsetHeight }),
    move: (around, at) => {
      const next = JSON.stringify([around, at]);
      if (next === drawn) return;
      drawn = next;
      frame.hidden = around === undefined;
      note.hidden = around === undefined || at === undefined;
      if (around === undefined) return;
      place(frame, around);
      frame.style.width = `${Math.round(around.width)}px`;
      frame.style.height = `${Math.round(around.height)}px`;
      if (at !== undefined) place(note, at);
    },
  };
}
