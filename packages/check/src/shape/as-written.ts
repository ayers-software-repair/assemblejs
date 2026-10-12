// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "../check/literal-value.js";
import { UNWRITTEN } from "../check/unwritten.js";
import { COMPUTED } from "./computed.js";
import type { Written } from "./written.js";

// The key that stands for the entries an object's source brings in without naming them.
const UNNAMED = "...";

/**
 * A value read from source, as it is shown: every literal as written, every computed part
 * marked where it stands and never left out, at any depth.
 */
export function asWritten(value: LiteralValue): Written {
  if (value === undefined) return COMPUTED;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return (value as readonly LiteralValue[]).map(asWritten);
  const fields = value as { readonly [key: string]: LiteralValue };
  const shown: Record<string, Written> = {};
  for (const [key, entry] of Object.entries(fields)) shown[key] = asWritten(entry);
  if (UNWRITTEN in value) shown[UNNAMED] = COMPUTED;
  return shown;
}
