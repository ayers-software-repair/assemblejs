// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { discoverAssemblies, viewFindings } from "@assemblejs/cli";
import type { AssemblyDefinition } from "@assemblejs/core";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import { needsABuild } from "./needs-a-build.js";
import { RENDERABLE_WITHOUT_A_BUILD } from "./renderable-without-a-build.js";

/**
 * The project's assemblies as a server would declare them, as far as that goes without a build,
 * for core's own transport to render and compose: a plain html view is its file, read when it
 * renders, with what its source places beside it. Every other view throws the reason it cannot
 * be shown, so whatever placed it falls back as it would for any render that throws, and the
 * reason is in the log.
 */
export function projectAssemblies(root: ProjectRoot): ReadonlyMap<string, AssemblyDefinition> {
  const { assemblies } = discoverAssemblies(withinRoot(root, "src", "assemblies"));
  const { placements } = viewFindings(root.path, assemblies);
  return new Map(
    assemblies.map((found): [string, AssemblyDefinition] => {
      const placed = placements.get(found.name);
      return [
        found.name,
        {
          name: found.name,
          views: {
            default: {
              renderer: found.renderer,
              markup: () => {
                if (!RENDERABLE_WITHOUT_A_BUILD.includes(found.renderer)) {
                  throw new Error(needsABuild(found.name, found.renderer));
                }
                return readFileSync(withinRoot(root, found.view), "utf8");
              },
              ...(placed === undefined ? {} : { placements: placed }),
            },
          },
        },
      ];
    }),
  );
}
