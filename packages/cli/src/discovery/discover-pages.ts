// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { SEGMENT } from "@assemblejs/core";
import { leadsOut } from "../root/leads-out.js";
import { outsideProblems } from "../root/outside-problems.js";
import type { DiscoveredPage } from "./discovered-page.js";
import { isDirectory } from "./is-directory.js";
import type { ProjectProblem } from "./project-problem.js";
import { suggestName } from "./suggest-name.js";

/**
 * Every page of a project: each directory under its `src/pages`. Like an assembly, a directory
 * IS a page: `home/home.html` is the page at `/`, `about/about.html` the page at `/about`, and a
 * `<name>.page.ts` beside the template declares a different route or a placement's policy when
 * one is needed.
 *
 * A directory that cannot be a page is reported, never skipped, for the same reason as an
 * assembly: a page an author renamed out of existence is otherwise found by a visitor's 404.
 *
 * Nothing outside the project is looked at. A directory that leads out of the root is reported
 * and not listed; a template or a declaration that leads out is reported and kept by its name,
 * for a reader to refuse.
 */
export function discoverPages(root: string): {
  readonly pages: readonly DiscoveredPage[];
  readonly problems: readonly ProjectProblem[];
} {
  const pages: DiscoveredPage[] = [];
  const problems: ProjectProblem[] = [];
  const within = `${root}/src/pages`.replaceAll("\\", "/");
  if (leadsOut(root, within)) return { pages, problems: outsideProblems(root, [within]) };

  let entries: string[];
  try {
    entries = readdirSync(within).sort();
  } catch {
    return { pages, problems };
  }

  for (const name of entries) {
    const at = `${within}/${name}`;
    // Asked before the entry is so much as looked at: one that leads out is not a directory
    // of this project's, whatever stands where it leads.
    if (leadsOut(root, at)) {
      problems.push(...outsideProblems(root, [at]));
      continue;
    }
    if (!isDirectory(at)) continue;
    if (!SEGMENT.test(name)) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: `page "${name}" is not a usable name; lower case, starting with a letter`,
        fix: `rename the directory to "${suggestName(name)}"`,
      });
      continue;
    }
    const files = readdirSync(at);
    if (!files.includes(`${name}.html`)) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: `page "${name}" has no template`,
        fix: `add ${name}/${name}.html, the whole document the page serves`,
      });
      continue;
    }
    const found: DiscoveredPage = {
      name,
      route: name === "home" ? "/" : `/${name}`,
      template: `${at}/${name}.html`,
      declaration: files.includes(`${name}.page.ts`) ? `${at}/${name}.page.ts` : undefined,
    };
    pages.push(found);
    problems.push(...outsideProblems(root, [found.template, found.declaration]));
  }
  return { pages, problems };
}
