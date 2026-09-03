// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { discoverAssemblies } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";

/**
 * The whole shape of a project in one read.
 *
 * A resource rather than a command, because an agent that has to ask what exists spends its
 * first three turns finding out.
 */
export function describeProject(root: ProjectRoot): {
  readonly root: string;
  readonly assemblies: readonly {
    name: string;
    renderer: string;
    view: string;
    hasClient: boolean;
  }[];
  readonly renderers: readonly string[];
  readonly problems: readonly string[];
} {
  const { assemblies, problems } = discoverAssemblies(withinRoot(root, "src", "assemblies"));
  return {
    root: root.path,
    assemblies: assemblies.map((assembly) => ({
      name: assembly.name,
      renderer: assembly.renderer,
      view: assembly.view,
      hasClient: assembly.client !== undefined,
    })),
    renderers: [...new Set(assemblies.map((assembly) => assembly.renderer))].sort(),
    problems,
  };
}
