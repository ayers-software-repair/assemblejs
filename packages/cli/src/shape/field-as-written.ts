// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "../check/literal-value.js";
import { UNWRITTEN } from "../check/unwritten.js";
import { asWritten } from "./as-written.js";
import { COMPUTED } from "./computed.js";
import type { Written } from "./written.js";

/**
 * One field of an object read from source, as it is shown: as written where the object names
 * it; COMPUTED where it does not and brings in entries unnamed, since the field may be among
 * them; and otherwise what its absence means, which the caller says.
 */
export function fieldAsWritten(
  fields: { readonly [key: string]: LiteralValue; readonly [UNWRITTEN]?: true },
  key: string,
  absent: Written,
): Written {
  if (key in fields) return asWritten(fields[key]);
  return UNWRITTEN in fields ? COMPUTED : absent;
}
