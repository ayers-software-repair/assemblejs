// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Why a registration that cannot be read stops what would have written to it, in the one
 * sentence every surface says: its server cannot be set in a file whose other contents would be
 * lost in the writing. What to do about it is the surface's own to add.
 */
export function cannotRegister(path: string): string {
  return `${path} is not JSON, which a comment in it is enough to cause, and a server cannot be added to it without losing what it holds`;
}
