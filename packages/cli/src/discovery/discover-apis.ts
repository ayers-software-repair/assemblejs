// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { SEGMENT_PATTERN } from "@assemblejs/core";
import { leadsOut } from "../root/leads-out.js";
import { outsideProblems } from "../root/outside-problems.js";
import type { ProjectProblem } from "./project-problem.js";
import { suggestName } from "./suggest-name.js";

const API = new RegExp(`^${SEGMENT_PATTERN}\\.api\\.ts$`);

/**
 * Every api file of a project, in name order: each `<name>.api.ts` in its `src/api`. Each
 * default-exports one `defineApi`. A file that looks like an api but is not named like one is
 * reported, because it would otherwise be left out of the build with nothing saying so.
 *
 * Nothing outside the project is looked at: a `src/api` that leads out of the root is reported
 * and not listed, and a file in it that leads out is reported and kept by its name, for a
 * reader to refuse.
 */
export function discoverApis(root: string): {
  readonly apis: readonly string[];
  readonly problems: readonly ProjectProblem[];
} {
  const at = `${root}/src/api`.replaceAll("\\", "/");
  if (leadsOut(root, at)) return { apis: [], problems: outsideProblems(root, [at]) };
  let entries: string[];
  try {
    entries = readdirSync(at).sort();
  } catch {
    return { apis: [], problems: [] };
  }
  const apis: string[] = [];
  const problems: ProjectProblem[] = [];
  for (const file of entries) {
    if (API.test(file)) {
      apis.push(`${at}/${file}`);
      problems.push(...outsideProblems(root, [`${at}/${file}`]));
    } else if (file.endsWith(".api.ts")) {
      problems.push({
        path: `${at}/${file}`,
        rule: "an-api-file-is-an-api",
        message: `"${file}" is not a usable api file name; lower case, starting with a letter`,
        fix: `rename it to "${suggestName(file.slice(0, -".api.ts".length))}.api.ts"`,
      });
    }
  }
  return { apis, problems };
}
