// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { relative } from "node:path";
import type { PartialMessage } from "esbuild";

/** The line a compiler's error names: Svelte's as `start`, Vue's as `loc.start`, from one. */
const lineOf = (said: unknown): number | undefined => {
  if (typeof said !== "object" || said === null) return undefined;
  const { start, loc } = said as { start?: unknown; loc?: { start?: unknown } | null };
  for (const at of [start, loc?.start]) {
    if (typeof at === "object" && at !== null && "line" in at && typeof at.line === "number") {
      return at.line;
    }
  }
  return undefined;
};

/**
 * A compiler's refusal of a view, as the bundler reports an error: at the view's own file, named
 * from where the build works as the bundler names every other file, and on the line the
 * compiler names, where it names one, with that line's text.
 *
 * Thrown as it was, the bundler reports a plugin's error where it was imported or thrown: a
 * line of the module the build generated, or of this command line's own code, for a mistake on
 * a line of the author's. The line is read off the error, or off what it gives as its cause.
 */
export function viewRefusal(
  error: unknown,
  file: string,
  source: string,
  working: string,
): PartialMessage {
  const line = lineOf(error) ?? lineOf(error instanceof Error ? error.cause : undefined);
  return {
    text: error instanceof Error ? error.message : String(error),
    location: {
      file: relative(working, file).split("\\").join("/"),
      ...(line === undefined ? {} : { line, lineText: source.split(/\r?\n/)[line - 1] ?? "" }),
    },
  };
}
