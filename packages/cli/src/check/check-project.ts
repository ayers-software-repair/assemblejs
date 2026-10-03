// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { findPlacements } from "@assemblejs/core";
import { buildProblems } from "../build/build-problems.js";
import { discoverApis } from "../discovery/discover-apis.js";
import { discoverAssemblies } from "../discovery/discover-assemblies.js";
import { discoverPages } from "../discovery/discover-pages.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { remotePlacements } from "./remote-placements.js";

/**
 * Everything wrong with a project that can be known without building it, each as a structure
 * with the file, the rule and the fix: the tree (assemblies, pages, apis), the renderers it
 * needs, and every page's placements against the assemblies that exist, or, for a placement its
 * page declares from another server, against the remotes `assemblejs.config.ts` declares. In
 * process, no shell, so the command line and the agent surface report the same findings the same
 * way.
 */
export function checkProject(root: string): readonly ProjectProblem[] {
  const src = join(root, "src");
  const assemblies = discoverAssemblies(join(src, "assemblies"));
  const pages = discoverPages(join(src, "pages"));
  const apis = discoverApis(join(src, "api"));
  const names = assemblies.assemblies.map((assembly) => assembly.name);
  const problems: ProjectProblem[] = [
    ...assemblies.problems,
    ...pages.problems,
    ...apis.problems,
    ...buildProblems(root, assemblies.assemblies),
  ];

  const configFile = join(root, "assemblejs.config.ts");
  const config = existsSync(configFile) ? readFileSync(configFile, "utf8") : "";
  for (const page of pages.pages) {
    const remote =
      page.declaration === undefined
        ? new Map<string, string | undefined>()
        : remotePlacements(readFileSync(page.declaration, "utf8"));
    let placements;
    try {
      placements = findPlacements(readFileSync(page.template, "utf8"));
    } catch (error) {
      problems.push({
        path: page.template,
        rule: "a-placement-names-an-assembly",
        message: error instanceof Error ? error.message : String(error),
        fix: 'write each placement as <assembly name="..."></assembly>',
      });
      continue;
    }
    for (const placement of placements) {
      if (remote.has(placement.name)) {
        const origin = originOf(remote.get(placement.name));
        if (origin === undefined || config.includes(`"${origin}"`)) continue;
        problems.push({
          path: page.declaration ?? page.template,
          rule: "a-placement-names-an-assembly",
          message: `page "${page.name}" places "${placement.name}" from ${origin}, which assemblejs.config.ts does not declare as a remote`,
          fix: `add { origin: "${origin}" } to remotes in assemblejs.config.ts`,
        });
        continue;
      }
      if (names.includes(placement.name)) continue;
      problems.push({
        path: page.template,
        rule: "a-placement-names-an-assembly",
        message: `page "${page.name}" places "${placement.name}", and there is no such assembly`,
        fix:
          names.length === 0
            ? `add it: assemblejs add assembly ${placement.name}`
            : `add it, or place one that exists: ${names.join(", ")}`,
      });
    }
  }
  return problems.map((problem) => ({
    ...problem,
    path: relative(root, problem.path).split("\\").join("/") || ".",
  }));
}

function originOf(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
