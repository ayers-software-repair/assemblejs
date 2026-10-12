// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A value as its source writes it, in a form JSON carries whole. What is written as a literal
 * stands as written; what is computed is the COMPUTED mark where the value would be; and an
 * object its source spreads into, or gives a computed key, has `...` among its keys, marked the
 * same way.
 */
export type Written =
  string | number | boolean | null | readonly Written[] | { readonly [key: string]: Written };
