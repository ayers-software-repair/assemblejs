// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { outsideProblems } from "../root/outside-problems.js";
import { styleProblems } from "../styles/style-problems.js";
import { RENDERER_PACKAGES } from "./renderer-packages.js";
import { rendererProblems } from "./renderer-problems.js";

/**
 * Everything that would stop a project building, found before the bundler runs: no server file,
 * or one that leads out of the project,
 * a view whose renderer this version cannot build, a renderer package or the Svelte compiler the
 * project has not installed, and a framework view with a `.client.ts`, whose browser behaviour is
 * its component already, and a stylesheet the build cannot carry into `dist/` intact. `check`
 * reports the same list, so it never answers clean for a project `build` would refuse.
 */
export function buildProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  // The server file is the project's own like any other: one that leads out of the root is a
  // finding, and is not what a build of this project bundles.
  const problems: ProjectProblem[] = [...outsideProblems(root, [join(root, "src", "server.ts")])];
  if (!existsSync(join(root, "src", "server.ts"))) {
    problems.push({
      path: join(root, "src", "server.ts"),
      rule: "the-server-file-never-grows",
      message: "there is no src/server.ts to build",
      fix: "add the server file `assemblejs new` writes, which hands createServer the generated project",
    });
  }
  // The framework a project lacks is one thing to install, said once however many views need it.
  const said = new Set<string>();
  for (const assembly of assemblies) {
    for (const problem of rendererProblems(root, assembly.name, assembly.renderer, assembly.view)) {
      if (said.has(problem.message)) continue;
      said.add(problem.message);
      problems.push(problem);
    }
    const known = Object.hasOwn(RENDERER_PACKAGES, assembly.renderer)
      ? RENDERER_PACKAGES[assembly.renderer]
      : undefined;
    if (known !== undefined && assembly.client !== undefined && known.template !== true) {
      problems.push({
        path: assembly.client,
        rule: "one-framework-per-assembly",
        message: `"${assembly.name}" has a .client.ts, but a ${known.name} view's browser behaviour is its component`,
        fix: "move what it does into the component and delete the .client.ts",
      });
    }
  }
  problems.push(...styleProblems(root, assemblies));
  return problems;
}
