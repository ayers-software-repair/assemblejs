// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the compiler said of a source it could not compile, each with the line it said it of, or
 * nothing where what was thrown is not the compiler's refusal: every reader here compiles a
 * source before it parses it, so a file that does not read as its language throws this.
 */
export function uncompiled(
  error: unknown,
): readonly { readonly text: string; readonly line: number | undefined }[] | undefined {
  if (typeof error !== "object" || error === null || !("errors" in error)) return undefined;
  if (!Array.isArray(error.errors)) return undefined;
  return (error.errors as readonly unknown[]).map((one) => {
    const said = one as {
      readonly text?: unknown;
      readonly location?: { readonly line?: unknown };
    };
    return {
      text: typeof said.text === "string" ? said.text : String(one),
      line: typeof said.location?.line === "number" ? said.location.line : undefined,
    };
  });
}
