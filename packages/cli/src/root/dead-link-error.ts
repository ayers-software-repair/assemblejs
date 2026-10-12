// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { OutsideRootError } from "./outside-root-error.js";

/**
 * Thrown when a tool is asked to touch a link that leads nowhere, or a path beneath one. One of
 * the root guard's refusals, so every reader that passes over a path that leads out of the
 * project passes over this one too; it says which of the two it is.
 */
export class DeadLinkError extends OutsideRootError {
  constructor(attempted: string, root: string) {
    super(attempted, root);
    this.name = "DeadLinkError";
    this.message = `"${attempted}" is a link that leads nowhere`;
  }
}
