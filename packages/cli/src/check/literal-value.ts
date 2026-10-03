// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A value as written in source, when it is written as a literal: a string, an object or an array
 * of them. Anything computed (a variable, a call, a template with a placeholder) is null, known
 * only to be there.
 */
export type LiteralValue =
  string | { readonly [key: string]: LiteralValue } | readonly LiteralValue[] | null;
