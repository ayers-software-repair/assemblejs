// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The element the outline is drawn in: one per page, added by the browser after the body, with
 * a root of its own, so nothing the page styles reaches it and nothing it styles reaches the
 * page. The server never writes it.
 */
export const OUTLINE_ELEMENT = "assemblejs-outline";
