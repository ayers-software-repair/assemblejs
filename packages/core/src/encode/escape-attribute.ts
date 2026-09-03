// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * For a value inside an attribute. Both quote characters are escaped, not only the one this
 * emitter happens to use: an encoder that assumes the caller's quoting is an encoder that is
 * correct until someone changes the caller.
 */
export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
