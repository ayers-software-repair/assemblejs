// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import type { Compilers } from "./compilers.js";
import { loadSvelteCompiler } from "./load-svelte-compiler.js";
import { loadVueCompiler } from "./load-vue-compiler.js";

/**
 * Loads the project's own compiler for each kind of view it has that needs one, and reports an
 * installed framework whose compiler cannot be loaded, which would otherwise fail on the first
 * file rather than here.
 */
export async function loadCompilers(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): Promise<{ readonly compilers: Compilers; readonly problems: readonly ProjectProblem[] }> {
  const uses = (renderer: string): boolean =>
    assemblies.some((assembly) => assembly.renderer === renderer);
  const svelte = uses("svelte") ? await loadSvelteCompiler(root) : undefined;
  const vue = uses("vue") ? await loadVueCompiler(root) : undefined;
  const problems: ProjectProblem[] = [];
  for (const [name, used, loaded] of [
    ["svelte", uses("svelte"), svelte],
    ["vue", uses("vue"), vue],
  ] as const) {
    if (used && loaded === undefined) {
      problems.push({
        path: join(root, "package.json"),
        rule: "a-view-needs-its-renderer",
        message: `the project's ${name} package has no compiler this build can load`,
        fix: `reinstall ${name}`,
      });
    }
  }
  return {
    compilers: {
      ...(svelte === undefined ? {} : { svelte }),
      ...(vue === undefined ? {} : { vue }),
    },
    problems,
  };
}
