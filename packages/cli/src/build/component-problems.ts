// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { readInside } from "../root/read-inside.js";
import { compileVue } from "./compile-vue.js";
import { engineSaid } from "./engine-said.js";
import { loadSvelteCompiler } from "./load-svelte-compiler.js";
import { loadVueCompiler } from "./load-vue-compiler.js";
import { viewRefusal } from "./view-refusal.js";

/**
 * Every Svelte and Vue view the project's own compiler refuses, found without building: each is
 * compiled, once, for the server, with the compiler a build would compile it with, and one that
 * throws is a problem naming the file, what the compiler said, and the line where it names one.
 * It is what `check` asks, so that it does not answer clean for a view a build would refuse; a
 * build meets the same refusal in the bundler, and does not compile each view a second time to
 * hear it.
 *
 * Without the compiler there is nothing to compile with, which is a finding of its own, so this
 * says nothing then; nor of a view that cannot be read or leads out of the project, which the
 * readers of a view report where the project names it.
 */
export async function componentProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): Promise<readonly ProjectProblem[]> {
  const uses = (renderer: string): boolean =>
    assemblies.some((assembly) => assembly.renderer === renderer);
  const svelte = uses("svelte") ? await loadSvelteCompiler(root) : undefined;
  const vue = uses("vue") ? await loadVueCompiler(root) : undefined;
  const problems: ProjectProblem[] = [];
  for (const assembly of assemblies) {
    const compile =
      assembly.renderer === "svelte" && svelte !== undefined
        ? (source: string, filename: string) => svelte(source, { filename, generate: "server" })
        : assembly.renderer === "vue" && vue !== undefined
          ? (source: string, filename: string) =>
              compileVue(vue, source, { filename, id: "check", side: "server" })
          : undefined;
    if (compile === undefined) continue;
    const file = isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view);
    let source: string;
    try {
      source = readInside(root, file);
    } catch {
      continue;
    }
    try {
      compile(source, file);
    } catch (error) {
      const line = viewRefusal(error, file, source, root).location?.line;
      problems.push({
        path: assembly.view,
        rule: "a-template-view-compiles",
        message: `"${assembly.name}" does not compile as ${assembly.renderer}: ${engineSaid(error)}${line === undefined ? "" : ` (line ${String(line)})`}`,
        fix: `correct the view so ${assembly.renderer} can read it`,
      });
    }
  }
  return problems;
}
