// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { DiscoveredPage } from "./discovered-page.js";
import { isDirectory } from "./is-directory.js";
import type { ProjectProblem } from "./project-problem.js";
import { suggestName } from "./suggest-name.js";

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Every page under a directory. Like an assembly, a directory IS a page: `home/home.html` is the
 * page at `/`, `about/about.html` the page at `/about`, and a `<name>.page.ts` beside the
 * template declares a different route or a placement's policy when one is needed.
 *
 * A directory that cannot be a page is reported, never skipped, for the same reason as an
 * assembly: a page an author renamed out of existence is otherwise found by a visitor's 404.
 */
export function discoverPages(root: string): {
  readonly pages: readonly DiscoveredPage[];
  readonly problems: readonly ProjectProblem[];
} {
  const pages: DiscoveredPage[] = [];
  const problems: ProjectProblem[] = [];

  let entries: string[];
  try {
    entries = readdirSync(root).sort();
  } catch {
    return { pages, problems };
  }

  for (const name of entries) {
    const directory = join(root, name);
    if (!isDirectory(directory)) continue;
    const at = `${root}/${name}`.replaceAll("\\", "/");
    if (!NAME.test(name)) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: `page "${name}" is not a usable name; lower case, starting with a letter`,
        fix: `rename the directory to "${suggestName(name)}"`,
      });
      continue;
    }
    const files = readdirSync(directory);
    if (!files.includes(`${name}.html`)) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: `page "${name}" has no template`,
        fix: `add ${name}/${name}.html, the whole document the page serves`,
      });
      continue;
    }
    pages.push({
      name,
      route: name === "home" ? "/" : `/${name}`,
      template: `${at}/${name}.html`,
      declaration: files.includes(`${name}.page.ts`) ? `${at}/${name}.page.ts` : undefined,
    });
  }
  return { pages, problems };
}
