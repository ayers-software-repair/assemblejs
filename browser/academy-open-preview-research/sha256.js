// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** SHA-256 over the exact delivered bytes, including binary tarballs and installed entries. */
export async function sha256(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes)))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
