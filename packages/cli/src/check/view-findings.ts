// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { SEGMENT } from "@assemblejs/core";
import type { ViewPlacement } from "@assemblejs/core";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { isStaticView } from "../discovery/is-static-view.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { collectPlacements } from "./collect-placements.js";
import { readViewPlacements } from "./read-view-placements.js";
import { viewModules } from "./view-modules.js";
import type { ViewPlacements } from "./view-placements.js";

const DIRECTIVE_FIX = 'write each placement as <assembly name="..."></assembly>';

/**
 * What every view in a project says it places, read from the files, and what is wrong with how
 * each one says it: a directive that cannot be read, a name or a view that could never be an
 * assembly's, and a placement whose name is computed. The build writes the placements into the
 * registry for boot; `check` holds them to the rules boot holds them to.
 *
 * A framework view is read with the components it is split into, since a slot written in one of
 * them is the view's as much as one written in its own file. A view missing from the answer is
 * one whose placements only its render knows.
 */
export function viewFindings(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): {
  readonly placements: ReadonlyMap<string, readonly ViewPlacement[]>;
  readonly problems: readonly ProjectProblem[];
} {
  const placements = new Map<string, readonly ViewPlacement[]>();
  const problems: ProjectProblem[] = [];
  for (const assembly of assemblies) {
    const file = isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view);
    const wrong = (rule: ProjectProblem["rule"], message: string, fix: string): void => {
      problems.push({ path: assembly.view, rule, message: `"${assembly.name}" ${message}`, fix });
    };
    let read: ViewPlacements;
    try {
      const [own, ...parts] = (isStaticView(assembly.renderer) ? [file] : viewModules(file)).map(
        (module) => readViewPlacements(module, assembly.renderer, readFileSync(module, "utf8")),
      );
      // A view that cannot be read places nothing known, and its render reads it.
      if (own?.placements === undefined) continue;
      const all = [own, ...parts];
      read = {
        placements: collectPlacements(
          all.flatMap((one) =>
            (one.placements ?? []).map(({ name, view }) => ({ name, view, shown: name })),
          ),
        ).placements,
        unnamed: all.flatMap((one) => one.unnamed),
      };
    } catch (error) {
      // A file that is not there is the tree's to report; a directive that cannot be read is this.
      if (error instanceof Error && !("code" in error)) {
        wrong(
          "a-placement-names-an-assembly",
          `holds a placement that cannot be read: ${error.message}`,
          DIRECTIVE_FIX,
        );
      }
      continue;
    }
    for (const shown of read.unnamed) {
      wrong(
        "a-placement-is-named-where-it-is-written",
        `places an assembly whose name is computed: ${shown}`,
        "write the name as a string where the placement is written; a service may shape the view it is placed with, never which assembly it is",
      );
    }
    if (read.placements === undefined) continue;
    const usable = read.placements.filter((placed) => {
      const unusable = [placed.name, placed.view].find(
        (value) => value !== undefined && !SEGMENT.test(value),
      );
      if (unusable === undefined) return true;
      wrong(
        "a-placement-names-an-assembly",
        `places "${unusable}", which no assembly or view could be named`,
        "name an assembly that exists: lower case, a letter first, then letters, digits and hyphens",
      );
      return false;
    });
    placements.set(assembly.name, usable);
  }
  return { placements, problems };
}
