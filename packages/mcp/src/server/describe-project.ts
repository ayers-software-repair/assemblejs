// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readShape } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import type { DescribedProject } from "./described-project.js";

/**
 * The whole shape of a project in one read: what exists and how it is wired, as its sources say
 * it, with nothing of the project's run and no build needed. Nothing outside the project is
 * read either: the reader stops at the root, marks what it did not open, and says why among
 * the problems.
 *
 * A resource rather than a command, because an agent that has to ask what exists spends its
 * first three turns finding out.
 */
export function describeProject(root: ProjectRoot): DescribedProject {
  return { root: root.path, ...readShape(root.path) };
}
