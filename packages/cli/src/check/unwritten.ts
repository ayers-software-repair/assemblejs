// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The mark on an object read as a literal whose keys are not all written: one with a spread or
 * a computed key among its entries. A symbol, so a reader that walks the entries never meets it,
 * and a reader that must have the whole object asks for it by name.
 */
export const UNWRITTEN: unique symbol = Symbol("unwritten");
