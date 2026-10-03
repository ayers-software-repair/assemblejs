// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the router sees when it matches a route. Two paths that differ only in a parameter's name
 * match exactly the same requests, so they collide exactly like identical strings.
 */
export function routeKey(method: string, path: string): string {
  return `${method} ${path.replace(/:[^/]+/g, ":")}`;
}
