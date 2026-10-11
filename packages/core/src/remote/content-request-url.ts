// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The url a remote's content endpoint is asked at: its content url, with the page's query on it
 * only where the remote is declared trusted and the query holds anything. An untrusted remote
 * is asked at the bare content url, whatever the visitor typed into the page's address.
 */
export function contentRequestUrl(
  content: string,
  trusted: boolean,
  query: URLSearchParams,
): string {
  const search = query.toString();
  return trusted && search !== "" ? `${content}?${search}` : content;
}
