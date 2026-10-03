// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { styleProblems } from "../styles/style-problems.js";
import { findPackage } from "./find-package.js";
import { RENDERER_PACKAGES } from "./renderer-packages.js";

/**
 * Everything that would stop a project building, found before the bundler runs: no server file,
 * a view whose renderer this version cannot build, a renderer package or the Svelte compiler the
 * project has not installed, and a framework view with a `.client.ts`, whose browser behaviour is
 * its component already, and a stylesheet the build cannot carry into `dist/` intact. `check`
 * reports the same list, so it never answers clean for a project `build` would refuse.
 */
export function buildProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  if (!existsSync(join(root, "src", "server.ts"))) {
    problems.push({
      path: join(root, "src", "server.ts"),
      rule: "the-server-file-never-grows",
      message: "there is no src/server.ts to build",
      fix: "add the server file `assemblejs new` writes, which hands createServer the generated project",
    });
  }
  // The frameworks whose views the build compiles with the project's own compiler.
  for (const [renderer, framework, named] of [
    ["svelte", "svelte", "Svelte"],
    ["vue", "vue", "Vue"],
  ] as const) {
    if (
      assemblies.some((assembly) => assembly.renderer === renderer) &&
      findPackage(root, framework) === undefined
    ) {
      problems.push({
        path: join(root, "package.json"),
        rule: "a-view-needs-its-renderer",
        message: `this project has ${named} assemblies and ${framework} is not installed`,
        fix: `install ${framework}`,
      });
    }
  }
  for (const assembly of assemblies) {
    if (assembly.renderer === "html") continue;
    const known = Object.hasOwn(RENDERER_PACKAGES, assembly.renderer)
      ? RENDERER_PACKAGES[assembly.renderer]
      : undefined;
    if (known === undefined) {
      problems.push({
        path: assembly.view,
        rule: "a-view-needs-its-renderer",
        message: `"${assembly.name}" is a ${assembly.renderer} assembly, which this version cannot build yet`,
        fix: `write it for one of: html, ${Object.keys(RENDERER_PACKAGES).join(", ")}`,
      });
      continue;
    }
    if (findPackage(root, known.package) === undefined) {
      problems.push({
        path: assembly.view,
        rule: "a-view-needs-its-renderer",
        message: `"${assembly.name}" is a ${known.name} assembly and ${known.package} is not installed`,
        fix: `install ${known.package}`,
      });
    }
    if (assembly.client !== undefined) {
      problems.push({
        path: assembly.client,
        rule: "one-framework-per-assembly",
        message: `"${assembly.name}" has a .client.ts, but a ${known.name} view's browser behaviour is its component`,
        fix: "move what it does into the component and delete the .client.ts",
      });
    }
  }
  problems.push(...styleProblems(assemblies));
  return problems;
}
