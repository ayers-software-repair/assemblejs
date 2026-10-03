// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";

/**
 * Every asset an assembly names under this server's asset prefix that the build did not write.
 *
 * Found at boot, because a missing module is otherwise found by a visitor whose page renders and
 * never becomes interactive. A url elsewhere is another origin's to answer for.
 */
export function assetProblems(
  assemblies: readonly AssemblyDefinition[],
  files: ReadonlyMap<string, string>,
): readonly string[] {
  const problems: string[] = [];
  for (const assembly of assemblies) {
    for (const url of [...(assembly.assets?.css ?? []), ...(assembly.assets?.js ?? [])]) {
      if (url.startsWith(`${ASSET_ROUTE_PREFIX}/`) && !files.has(url)) {
        problems.push(`assembly "${assembly.name}" needs ${url}, which the build did not write`);
      }
    }
  }
  return problems;
}
