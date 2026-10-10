// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "../check/literal-value.js";
import type { UNWRITTEN } from "../check/unwritten.js";

/** The entries of a value its source writes as an object, and undefined for anything else. */
export function fieldsOf(
  value: LiteralValue,
): { readonly [key: string]: LiteralValue; readonly [UNWRITTEN]?: true } | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as { readonly [key: string]: LiteralValue; readonly [UNWRITTEN]?: true })
    : undefined;
}
