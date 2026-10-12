// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The relative luminance of a colour written as a hex triplet, by WCAG 2.2's definition (its
 * glossary, read 2026-10-11): each sRGB channel is linearised, `c / 12.92` up to 0.04045 and
 * `((c + 0.055) / 1.055) ^ 2.4` above it, and `L = 0.2126 R + 0.7152 G + 0.0722 B`. A value that
 * is not `#rgb` or `#rrggbb` is not judged, and answers undefined: a rule refuses only what its
 * reader can be certain of.
 */
export function relativeLuminance(colour: string): number | undefined {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim())?.[1];
  if (hex === undefined) return undefined;
  const wide = hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex;
  const channel = (at: number): number => {
    const srgb = Number.parseInt(wide.slice(at, at + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}
