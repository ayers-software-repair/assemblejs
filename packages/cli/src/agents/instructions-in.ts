// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { INSTRUCTION_MARKERS } from "./instruction-markers.js";

/**
 * The part of an `AGENTS.md` this command line wrote, its two comments included, and where it
 * stands in the file; undefined for a file that carries none, or that never closes one. Its
 * text is given with its lines ended as this command line ends them, so a checkout that ends
 * them otherwise holds the same part.
 */
export function instructionsIn(
  file: string,
): { readonly text: string; readonly start: number; readonly end: number } | undefined {
  const start = file.indexOf(INSTRUCTION_MARKERS.opening);
  if (start === -1) return undefined;
  const closing = file.indexOf(INSTRUCTION_MARKERS.end, start);
  if (closing === -1) return undefined;
  const end = closing + INSTRUCTION_MARKERS.end.length;
  return { text: file.slice(start, end).replaceAll("\r\n", "\n"), start, end };
}
