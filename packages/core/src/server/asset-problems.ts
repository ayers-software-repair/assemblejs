// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";

/**
 * Every asset an assembly names under this server's asset prefix that the build did not write.
 *
 * Found at boot, because a missing module is otherwise found by a visitor whose page renders and
 * never becomes interactive. A url on this server outside the prefix is refused too, because
 * nothing serves it; only a url naming another origin is that origin's to answer for.
 */
export function assetProblems(
  assemblies: readonly AssemblyDefinition[],
  files: ReadonlyMap<string, string>,
): readonly string[] {
  const problems: string[] = [];
  for (const assembly of assemblies) {
    for (const url of [...(assembly.assets?.css ?? []), ...(assembly.assets?.js ?? [])]) {
      if (url.startsWith(`${ASSET_ROUTE_PREFIX}/`)) {
        if (!files.has(url)) {
          problems.push(`assembly "${assembly.name}" needs ${url}, which the build did not write`);
        }
      } else if (!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) {
        problems.push(
          `assembly "${assembly.name}" needs ${url}, which is on this server but not under ${ASSET_ROUTE_PREFIX}/, where nothing serves it`,
        );
      }
    }
  }
  return problems;
}
