// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OUTLINE_STYLES } from "@assemblejs/core";

/** Contrast by WCAG 2.2's definitions of relative luminance and contrast ratio. */
const contrast = (one: string, other: string): number => {
  const luminance = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((at) => {
      const channel = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(one), luminance(other)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
};

describe("the stylesheet an outline is drawn with", () => {
  it("styles its own root and never the page: no selector reaches a document or an envelope", () => {
    expect(OUTLINE_STYLES).toContain(":host {");
    expect(OUTLINE_STYLES).not.toMatch(/(^|[\s,}])(html|body|:root|assembly-root)\b/m);
  });

  it("takes no clicks from the page but on its own controls, and is not printed", () => {
    expect(OUTLINE_STYLES).toMatch(/:host \{[^}]*pointer-events: none;/);
    expect(OUTLINE_STYLES).toMatch(/@media print \{\s*:host \{\s*display: none;/);
  });

  it("sets white words on every tone at 4.5:1 or more, and the card's words on its ground", () => {
    const tones = [...OUTLINE_STYLES.matchAll(/--tone: (#[0-9a-f]{6});/g)].map((found) => found[1]);
    expect(tones).toHaveLength(6);
    for (const tone of tones)
      expect(contrast(tone ?? "", "#ffffff"), tone).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#d1d5db", "#111827")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#f9fafb", "#111827")).toBeGreaterThanOrEqual(4.5);
  });
});
