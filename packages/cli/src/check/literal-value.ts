// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { UNWRITTEN } from "./unwritten.js";

/**
 * A value as written in source, when it is written as a literal: a string, a number (negated or
 * not), a boolean, null, an object or an array of them. Anything computed (a variable, a call,
 * a template with a placeholder) is undefined, known only to be there; an object with a spread
 * or a computed key among its entries carries the UNWRITTEN mark beside the entries it has.
 */
export type LiteralValue =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: LiteralValue; readonly [UNWRITTEN]?: true }
  | readonly LiteralValue[]
  | undefined;
