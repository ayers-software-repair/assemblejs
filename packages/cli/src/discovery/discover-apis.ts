// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { SEGMENT_PATTERN } from "@assemblejs/core";
import { leadsOut } from "../root/leads-out.js";
import { outsideProblems } from "../root/outside-problems.js";
import { isDirectory } from "./is-directory.js";
import type { ProjectProblem } from "./project-problem.js";
import { suggestName } from "./suggest-name.js";

const API = new RegExp(`^${SEGMENT_PATTERN}\\.api\\.ts$`);
// A file that is nearly one: the kind with no name, or its plural.
const NEARLY = /^(?:(.+)\.)?apis?\.ts$/;

/**
 * Every api file of a project, in name order: each `<name>.api.ts` in its `src/api`. Each
 * default-exports one `defineApi`. A file that looks like an api but is not named like one is
 * reported, because it would otherwise be left out of the build with nothing saying so; and so
 * are a file that is nearly one (`api.ts`, `orders.apis.ts`) and a `src/apis` beside it.
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
  let entries: string[] = [];
  try {
    entries = readdirSync(at).sort();
  } catch {
    // No api directory at all is a project with no apis.
  }
  const apis: string[] = [];
  const problems: ProjectProblem[] = [];
  for (const file of entries) {
    const nearly = NEARLY.exec(file);
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
    } else if (nearly !== null) {
      const [, stem] = nearly;
      problems.push({
        path: `${at}/${file}`,
        rule: "an-api-file-is-an-api",
        message: `"${file}" is not read: an api file is named "<name>.api.ts"`,
        fix:
          stem === undefined
            ? "rename it for the api it declares, or remove it"
            : `rename it to "${suggestName(stem)}.api.ts", or remove it`,
      });
    }
  }
  // The directory one letter away, which nothing reads.
  const beside = `${root}/src/apis`.replaceAll("\\", "/");
  if (!leadsOut(root, beside) && isDirectory(beside)) {
    problems.push({
      path: beside,
      rule: "an-api-file-is-an-api",
      message: `"src/apis" is not read: api files are in "src/api"`,
      fix: "move its files into src/api, or remove it",
    });
  }
  return { apis, problems };
}
