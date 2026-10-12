// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { EnvelopeFacts } from "@assemblejs/core/outline";
import { createBox } from "@assemblejs/core/outline";

const facts: EnvelopeFacts = {
  name: "<img src=x onerror=alert(1)>",
  tone: "remote",
  brief: "42 ms",
  rows: [
    ["From", "https://b.example"],
    ["Answered", "<b>fetched</b>"],
  ],
};

describe("what is made to draw one envelope's box", () => {
  it("writes what it is told as text, never as markup, and colours both parts by what answered", () => {
    const box = createBox(document);
    box.tell(facts);
    expect(box.note.querySelector("img")).toBeNull();
    expect(box.note.querySelector(".chip b")?.textContent).toBe(facts.name);
    expect([...box.note.querySelectorAll("dt")].map((term) => term.textContent)).toEqual([
      "From",
      "Answered",
    ]);
    expect(box.note.querySelector("dd:last-child")?.textContent).toBe("<b>fetched</b>");
    expect(box.frame.dataset.tone).toBe("remote");
    expect(box.note.dataset.tone).toBe("remote");
  });

  it("opens its card when the chip is pressed, and says so to whoever cannot see it", () => {
    const box = createBox(document);
    box.tell(facts);
    const chip = box.note.querySelector("button") as HTMLButtonElement;
    const card = box.note.querySelector("dl") as HTMLElement;
    expect([card.hidden, chip.getAttribute("aria-expanded")]).toEqual([true, "false"]);
    chip.click();
    expect([card.hidden, chip.getAttribute("aria-expanded")]).toEqual([false, "true"]);
    chip.click();
    expect(card.hidden).toBe(true);
  });

  it("moves by single style properties, and hides both parts where there is no box", () => {
    const box = createBox(document);
    box.move(
      { left: 10.4, top: 20.6, width: 300, height: 80 },
      { left: 10, top: 21, width: 60, height: 18 },
    );
    expect(box.frame.style.transform).toBe("translate(10px, 21px)");
    expect([box.frame.style.width, box.frame.style.height]).toEqual(["300px", "80px"]);
    expect(box.note.style.transform).toBe("translate(10px, 21px)");
    expect(box.frame.getAttribute("style")).not.toBeNull();
    box.move(undefined, undefined);
    expect([box.frame.hidden, box.note.hidden]).toEqual([true, true]);
    box.move({ left: 0, top: 0, width: 1, height: 1 }, undefined);
    expect([box.frame.hidden, box.note.hidden]).toEqual([false, true]);
  });
});
