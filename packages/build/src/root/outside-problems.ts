// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { deadLink } from "./dead-link.js";
import { leadsOut } from "./leads-out.js";

/**
 * One finding for each of these paths that leads out of the project, or is a link to nothing,
 * which the readers refuse to open. Reported where the project names the path, by the rule that
 * says why, so the mark a reader leaves in its place is explained once, beside it.
 */
export function outsideProblems(
  root: string,
  paths: readonly (string | undefined)[],
): readonly ProjectProblem[] {
  return paths
    .filter((path): path is string => path !== undefined && leadsOut(root, path))
    .map((path) => {
      const named = path.split("/").slice(-1).join("");
      return deadLink(resolve(root), resolve(path)) === undefined
        ? {
            path,
            rule: "a-project-stays-inside-its-root",
            message: `${named} leads out of the project, and nothing outside the project is read`,
            fix: "put the file or directory itself where the link is, or bring what it leads to in as a package",
          }
        : {
            path,
            rule: "a-project-stays-inside-its-root",
            message: `${named} is a link that leads nowhere, and nothing is read through it`,
            fix: "remove the link, or put the file it names where it points",
          };
    });
}
