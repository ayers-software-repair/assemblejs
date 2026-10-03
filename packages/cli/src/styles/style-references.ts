// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const URL_REFERENCE = /url\(\s*(["']?)([^"')]*)\1\s*\)/gi;

/**
 * Every `url()` in a CSS value that names a file beside the stylesheet: not a data url, not an
 * absolute url or one from the site's root, and not a fragment, each of which the browser
 * resolves the same wherever the sheet is served from.
 */
export function styleReferences(value: string): readonly string[] {
  const found: string[] = [];
  for (const match of value.matchAll(URL_REFERENCE)) {
    const reference = (match[2] ?? "").trim();
    if (reference === "" || /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(reference)) continue;
    found.push(reference);
  }
  return found;
}
