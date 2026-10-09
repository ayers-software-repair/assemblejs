// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { TEMPLATE_RENDERERS } from "../discovery/template-renderers.js";
import { engineSaid } from "./engine-said.js";
import { loadTemplateCompiler } from "./load-template-compiler.js";

const PACKAGE = "@assemblejs/renderer-templates";

/**
 * Every template view the project's own engine cannot read, found before anything is built or
 * served: each `.ejs`, `.hbs`, `.md`, `.njk` and `.pug` view is compiled, once, with the
 * compiler the project's `@assemblejs/renderer-templates` loads for its language, and one that
 * throws is a problem naming the file and what the engine said. A view that cannot be read, and
 * a package or an engine of it that cannot be loaded, are problems of their own kind, never
 * blamed on the template. Without the package there is nothing to compile with, which the build
 * reports on its own, so this says nothing then.
 */
export async function templateProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): Promise<readonly ProjectProblem[]> {
  const templated = assemblies.filter((assembly) => TEMPLATE_RENDERERS.includes(assembly.renderer));
  if (templated.length === 0) return [];
  const broken = (what: string, error: unknown): ProjectProblem => ({
    path: join(root, "package.json"),
    rule: "a-view-needs-its-renderer",
    message: `the project's ${PACKAGE} could not load ${what}: ${engineSaid(error)}`,
    fix: `reinstall ${PACKAGE}`,
  });
  let load;
  try {
    load = await loadTemplateCompiler(root);
  } catch (error) {
    return [broken("at all", error)];
  }
  if (load === undefined) return [];
  const problems: ProjectProblem[] = [];
  const engines = new Set<string>();
  for (const assembly of templated) {
    const file = isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view);
    let source: string;
    try {
      source = readFileSync(file, "utf8");
    } catch (error) {
      problems.push({
        path: assembly.view,
        rule: "a-template-view-compiles",
        message: `"${assembly.name}" cannot be read: ${engineSaid(error)}`,
        fix: "make the view a file this build can read",
      });
      continue;
    }
    let compile;
    try {
      compile = await load(assembly.renderer);
    } catch (error) {
      if (!engines.has(assembly.renderer))
        problems.push(broken(`its ${assembly.renderer} engine`, error));
      engines.add(assembly.renderer);
      continue;
    }
    try {
      compile(source);
    } catch (error) {
      problems.push({
        path: assembly.view,
        rule: "a-template-view-compiles",
        message: `"${assembly.name}" does not compile as ${assembly.renderer}: ${engineSaid(error)}`,
        fix: `correct the template so ${assembly.renderer} can read it`,
      });
    }
  }
  return problems;
}
