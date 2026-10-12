// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The names of a route's parameters, in the order it writes them: each whole segment that
 * begins with a colon, which is the one way a route writes a parameter. The one reading of it,
 * for whatever asks whether a route has a parameter or which: the server's own table, the
 * command line weighing a page, and an agent composing one for a visitor.
 */
export function routeParameters(route: string): readonly string[] {
  return route
    .split("/")
    .filter((segment) => segment.startsWith(":"))
    .map((segment) => segment.slice(1));
}
