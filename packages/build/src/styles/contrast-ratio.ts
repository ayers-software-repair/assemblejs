// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { relativeLuminance } from "./relative-luminance.js";

/**
 * The contrast ratio of two colours, `(L1 + 0.05) / (L2 + 0.05)` with L1 the lighter's relative
 * luminance and L2 the darker's (WCAG 2.2, its glossary, read 2026-10-11): from 1 for the same
 * colour to 21 for black on white. Undefined where either colour is not one the reader judges.
 */
export function contrastRatio(one: string, other: string): number | undefined {
  const a = relativeLuminance(one);
  const b = relativeLuminance(other);
  if (a === undefined || b === undefined) return undefined;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
