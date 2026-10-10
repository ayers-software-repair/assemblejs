// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readShape } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { DescribedProject } from "./described-project.js";

// What the shape is read from. Each is held to the root before anything beneath it is opened,
// so a link that leads out of the project is refused and not followed.
const READ = [
  ["src", "assemblies"],
  ["src", "pages"],
  ["src", "api"],
  ["assemblejs.config.ts"],
] as const;

/**
 * The whole shape of a project in one read: what exists and how it is wired, as its sources say
 * it, with nothing of the project's run and no build needed.
 *
 * A resource rather than a command, because an agent that has to ask what exists spends its
 * first three turns finding out.
 */
export function describeProject(root: ProjectRoot): DescribedProject {
  for (const segments of READ) withinRoot(root, ...segments);
  return { root: root.path, ...readShape(root.path) };
}
