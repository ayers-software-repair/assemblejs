// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The lines a failed bundle is reported with: each of the bundler's errors with the file and line
 * it names, or the thrown error's message when the failure was not the bundler's.
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
    ).map((message) =>
      message.location?.file === undefined
        ? String(message.text)
        : `${message.location.file}:${String(message.location.line)} ${String(message.text)}`,
    );
  }
  return [error instanceof Error ? error.message : String(error)];
}
