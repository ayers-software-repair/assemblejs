// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { envelopeRect } from "@assemblejs/core/outline";

/** A box as a browser that lays a page out would answer it. */
const box = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
const none = box(0, 0, 0, 0);

/** An envelope whose own boxes and whose children's are the ones given, in a stand-in layout. */
const envelope = (own: readonly DOMRect[], children: readonly DOMRect[]): Element => {
  const element = document.createElement("assembly-root");
  vi.spyOn(element, "getClientRects").mockReturnValue(own as unknown as DOMRectList);
  for (const rect of children) {
    const child = document.createElement("section");
    vi.spyOn(child, "getBoundingClientRect").mockReturnValue(rect);
    element.append(child);
  }
  return element;
};

describe("the box an assembly takes on the screen", () => {
  // Around a block, a browser answers an envelope's own box as the whole line the block stands
  // in, so a section with a margin was boxed from one edge of the page to the other.
  it("is the smallest that holds the top of what the envelope holds, and not the envelope's line", () => {
    expect(
      envelopeRect(
        envelope(
          [none, box(0, 40, 960, 132), none],
          [box(16, 40, 928, 132), box(16, 180, 200, 40)],
        ),
      ),
    ).toEqual({ left: 16, top: 40, width: 928, height: 180 });
  });

  it("is the envelope's own box where it holds nothing that takes room", () => {
    expect(envelopeRect(envelope([box(10, 10, 80, 18)], [none]))).toEqual({
      left: 10,
      top: 10,
      width: 80,
      height: 18,
    });
  });

  it("is undefined for an envelope that takes none, and passes over a child that takes none", () => {
    expect(envelopeRect(envelope([], [none]))).toBeUndefined();
    expect(envelopeRect(envelope([none], [none, box(4, 6, 20, 10)]))).toEqual({
      left: 4,
      top: 6,
      width: 20,
      height: 10,
    });
  });

  it("measures inside a shadow root, where the envelope has one", () => {
    const element = envelope([box(0, 50, 960, 24)], []);
    const inner = document.createElement("p");
    vi.spyOn(inner, "getBoundingClientRect").mockReturnValue(box(16, 50, 120, 24));
    element.attachShadow({ mode: "open" }).append(inner);
    expect(envelopeRect(element)).toEqual({ left: 16, top: 50, width: 120, height: 24 });
  });
});
