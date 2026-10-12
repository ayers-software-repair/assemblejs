// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The lines a failed bundle is reported with: each of the bundler's errors with the file and line
 * it names, the file alone where it names no line, or the thrown error's message when the
 * failure was not the bundler's.
 */
export function describeBuildFailure(error: unknown): readonly string[] {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    return (
      error.errors as ReadonlyArray<{
        text?: string;
        location?: { file?: string; line?: number } | null;
      }>
    ).map((message) => {
      if (message.location?.file === undefined) return String(message.text);
      // Lines count from one: none, or nought, is an error of the file and of no line of it.
      const line = message.location.line;
      const at = line === undefined || line === 0 ? "" : `:${String(line)}`;
      return `${message.location.file}${at} ${String(message.text)}`;
    });
  }
  return [error instanceof Error ? error.message : String(error)];
}
