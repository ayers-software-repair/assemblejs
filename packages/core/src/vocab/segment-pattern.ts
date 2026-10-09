// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The shape of one segment of the product's own grammar: an assembly's name, a view's name,
 * a placement's `name` or `view`, a part of a content url. Lower case, a letter first, letters,
 * digits and hyphens after, so a segment is a usable url segment and can never carry the
 * identity separator. Unanchored and ungrouped, so a longer pattern can embed it; `SEGMENT` is
 * the anchored test of one whole string.
 */
export const SEGMENT_PATTERN = "[a-z][a-z0-9-]*";
