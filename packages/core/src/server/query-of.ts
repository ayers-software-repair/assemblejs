// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The query string of a request url, parsed. Every route that reads one reads it through here,
 * so an assembly, a page and an api all see a query the same way.
 */
export function queryOf(url: string): URLSearchParams {
  const at = url.indexOf("?");
  return new URLSearchParams(at === -1 ? "" : url.slice(at));
}
