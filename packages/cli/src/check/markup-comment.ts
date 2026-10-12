// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A comment in a component's markup, each one whole. What an author commented out is not what
 * the view writes, so the readers of a Vue template and of Svelte markup take every comment
 * out before they look for what it places.
 */
export const MARKUP_COMMENT = /<!--[\s\S]*?-->/g;
