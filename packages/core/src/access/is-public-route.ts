// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Whether a path is one of the public routes: equal to an entry, or under an entry that ends in
 * `/*`. Compared exactly, case included, the way the router matches.
 */
export function isPublicRoute(path: string, publicRoutes: readonly string[]): boolean {
  return publicRoutes.some((route) =>
    route.endsWith("/*") ? path.startsWith(route.slice(0, -1)) : path === route,
  );
}
