// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Whether a page's policy places a name from another server: its entry is an object with a
 * `url`. Anything else, an entry that is not an object included, is a local placement as far as
 * the placement rules are concerned; what is wrong with the entry itself is reported by them.
 */
export function isRemotePolicy(place: Readonly<Record<string, unknown>>, name: string): boolean {
  const policy = Object.hasOwn(place, name) ? place[name] : undefined;
  return (
    typeof policy === "object" &&
    policy !== null &&
    (policy as { readonly url?: unknown }).url !== undefined
  );
}
