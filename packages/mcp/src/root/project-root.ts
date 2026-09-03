// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The one directory every tool is scoped to, resolved once at start.
 *
 * A branded type rather than a bare string, so a path that has not been through `resolveRoot`
 * cannot be passed where a root is expected. The check is the point of the whole module and a
 * check that is easy to skip is a check that gets skipped.
 */
export interface ProjectRoot {
  readonly path: string;
  readonly __brand: "ProjectRoot";
}
