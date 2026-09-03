// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The element a page template writes to place an assembly: `<assembly name="cart">`.
 *
 * It is a directive, not markup. The server replaces it and never emits it, which is why it
 * needs no hyphen and reads as the plain noun. What the server emits in its place is the
 * envelope, a real custom element with a different name.
 */
export const PLACEMENT_ELEMENT = "assembly";
