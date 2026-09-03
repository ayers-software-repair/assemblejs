// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Everything wrong with a set of assemblies, found before anything listens.
 *
 * Every check that can refuse runs here, so a process that is accepting connections is a
 * process that is configured. A server that throws after `listen` has already told a load
 * balancer it is healthy.
 */
export function bootProblems(assemblies: readonly AssemblyDefinition[]): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const assembly of assemblies) {
    if (!NAME.test(assembly.name)) {
      problems.push(
        `assembly "${assembly.name}" is not a usable url segment; names are lower case, starting with a letter`,
      );
    }
    if (seen.has(assembly.name)) {
      problems.push(`assembly "${assembly.name}" is declared more than once`);
    }
    seen.add(assembly.name);

    if (assembly.views[DEFAULT_VIEW] === undefined) {
      problems.push(`assembly "${assembly.name}" has no "${DEFAULT_VIEW}" view`);
    }
    for (const view of Object.keys(assembly.views)) {
      if (!NAME.test(view)) {
        problems.push(
          `assembly "${assembly.name}" has a view "${view}" that is not a usable url segment`,
        );
      }
    }
  }
  return problems;
}
