// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The path a request asked for, as the router reads it: without its query, and each segment
 * decoded once, so an encoded spelling of an address is that address and nothing decided about a
 * path can be answered differently by spelling it another way. An encoded slash stays encoded,
 * as the router keeps it, so decoding never joins two segments or splits one. None for a segment
 * that does not decode, which the router refuses as well.
 */
export function requestedPath(url: string): string | undefined {
  const path = url.split("?")[0] ?? "/";
  if (!path.includes("%")) return path;
  try {
    return path
      .split("/")
      .map((segment) => decodeURIComponent(segment).replaceAll("/", "%2F"))
      .join("/");
  } catch {
    return undefined;
  }
}
