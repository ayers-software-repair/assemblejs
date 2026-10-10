// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { PageDefinition } from "../page/page-definition.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { SEGMENT } from "../vocab/segment.js";
import { apiProblems } from "./api-problems.js";
import { pageProblems } from "./page-problems.js";
import { placedAssemblyOf } from "./placed-assembly-of.js";
import { remoteProblems } from "./remote-problems.js";
import { viewPlacementProblems } from "./view-placement-problems.js";
import { viewSchema } from "./view-schema.js";

/**
 * Everything wrong with a set of assemblies, apis, pages and remotes, found before anything
 * listens.
 *
 * Every check that can refuse runs here, so a process that is accepting connections is a
 * process that is configured. A server that throws after `listen` has already told a load
 * balancer it is healthy.
 */
export function bootProblems(
  assemblies: readonly AssemblyDefinition[],
  apis: readonly ApiDefinition[] = [],
  pages: readonly PageDefinition[] = [],
  remotes: readonly RemoteDefinition[] = [],
): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const assembly of assemblies) {
    if (!SEGMENT.test(assembly.name)) {
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
    for (const [view, declared] of Object.entries(assembly.views)) {
      if (!SEGMENT.test(view)) {
        problems.push(
          `assembly "${assembly.name}" has a view "${view}" that is not a usable url segment`,
        );
      }
      for (const problem of viewSchema(declared).problems) {
        problems.push(`assembly "${assembly.name}" view "${view}": ${problem}`);
      }
      for (const placed of declared.placements ?? []) {
        for (const value of [placed.name, placed.view]) {
          if (value !== undefined && !SEGMENT.test(value)) {
            problems.push(
              `assembly "${assembly.name}" view "${view}" places "${value}", which is not a usable url segment`,
            );
          }
        }
      }
    }
  }
  // What each view's source is known to place, held as a page's placements are: a name with no
  // assembly, a view it lacks and a view that leads back to itself are refusals, not requests.
  const placeable = new Map(
    assemblies.map((assembly) => [assembly.name, placedAssemblyOf(assembly)]),
  );
  for (const assembly of assemblies) {
    for (const view of Object.keys(assembly.views)) {
      const at = `assembly "${assembly.name}" view "${view}"`;
      problems.push(
        ...viewPlacementProblems(at, { name: assembly.name, view }, placeable).map(
          (problem) => problem.message,
        ),
      );
    }
  }
  return [
    ...problems,
    ...apiProblems(apis),
    ...remoteProblems(remotes),
    ...pageProblems(pages, assemblies, apis, remotes),
  ];
}
