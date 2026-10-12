// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The mark some editors open a text file with, U+FEFF, which says how the file is encoded and is
 * no part of what it holds. A reader passes over it and a writer leaves it first: JSON read with
 * it is refused, and anything written before it turns it into a character in the text.
 */
export const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
