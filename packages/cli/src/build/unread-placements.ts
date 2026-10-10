// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "../discovery/project-problem.js";

/**
 * Of what is wrong with a project's views, what a build refuses: a placement that cannot be
 * read, and one that names what no assembly could be. Such a view fails whole when it renders,
 * as a template that does not compile fails. The other rules a view is held to are `check`'s
 * and boot's, and a view that breaks one of those still builds.
 */
export function unreadPlacements(problems: readonly ProjectProblem[]): readonly ProjectProblem[] {
  return problems.filter((problem) => problem.rule === "a-placement-names-an-assembly");
}
