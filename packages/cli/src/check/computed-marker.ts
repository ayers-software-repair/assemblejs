// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Stands in a template's markup wherever its language computes what it writes, so what is left
 * reads as a page's template does. A segment, so a directive holding it still reads; a reader
 * that finds it in a name, a view or an attribute knows that only a render knows the value.
 */
export const COMPUTED_MARKER = "computed-by-the-template";
