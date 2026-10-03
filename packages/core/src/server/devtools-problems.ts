// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Devtools } from "../devtools/devtools.js";

/**
 * Everything wrong with a set of devtools routes, found before anything listens: a path that
 * does not start with a slash would land beside the prefix rather than under it, and two routes
 * at one path would disagree about which answers.
 */
export function devtoolsProblems(devtools: Devtools): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const route of devtools.routes) {
    if (!route.path.startsWith("/")) {
      problems.push(`devtools route "${route.path}" does not start with "/"`);
    }
    if (seen.has(route.path))
      problems.push(`devtools route "${route.path}" is declared more than once`);
    seen.add(route.path);
  }
  return problems;
}
