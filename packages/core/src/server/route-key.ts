// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the router sees when it matches a route. Two paths that differ only in a parameter's name
 * match exactly the same requests, so they collide exactly like identical strings, and so do two
 * that differ only in a trailing slash, which the router does not tell apart.
 */
export function routeKey(method: string, path: string): string {
  const slashless = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return `${method} ${slashless.replace(/:[^/]+/g, ":")}`;
}
