// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The path a request asked for, as the router reads it: without its query, and each segment
 * decoded once, so an encoded spelling of an address is that address and nothing decided about a
 * path can be answered differently by spelling it another way. An encoded slash stays encoded,
 * as the router keeps it, so decoding never joins two segments or splits one. None for a segment
 * that does not decode, which the router refuses as well.
 *
 * Given the route that answers it, as declared, it ends in a slash where that route does:
 * `/admin/` is `/admin`, `/assembly/cart` is `/assembly/cart/`. Otherwise, or under a wildcard,
 * it is read as asked.
 */
export function requestedPath(url: string, route?: string): string | undefined {
  const asked = url.split("?")[0] ?? "/";
  let path = asked;
  if (asked.includes("%")) {
    try {
      path = asked
        .split("/")
        .map((segment) => decodeURIComponent(segment).replaceAll("/", "%2F"))
        .join("/");
    } catch {
      return undefined;
    }
  }
  if (route === undefined || route.endsWith("*") || path === "/") return path;
  const slashless = path.endsWith("/") ? path.slice(0, -1) : path;
  return route.endsWith("/") ? `${slashless}/` : slashless;
}
