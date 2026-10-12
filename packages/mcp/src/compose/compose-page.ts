// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import { discoverPages, readInside, readPagePolicy } from "@assemblejs/cli";
import type { PagePolicy } from "@assemblejs/cli";
import { pagePlan } from "@assemblejs/core";
import type { ProjectRoot } from "../root/project-root.js";
import { composeTemplate } from "./compose-template.js";
import type { ComposedPage } from "./composed-page.js";
import { pagePlacements } from "./page-placements.js";

const NONE: PagePolicy = { place: {}, remote: new Map(), stream: undefined };

/**
 * Composes one of the project's pages NOW, by name: its template under the policy its
 * declaration writes, as the server plans it, so the agent sees the page it made and not a
 * template it pasted. The page and its declaration are read as `check` reads them, nothing of
 * the project's run; a page the project has not, or a declaration that cannot be read, is a
 * problem the agent can act on, never a thrown error.
 */
export async function composePage(root: ProjectRoot, name: string): Promise<ComposedPage> {
  const page = discoverPages(root.path).pages.find((found) => found.name === name);
  if (page === undefined) {
    return {
      html: "",
      diagnostics: [],
      problems: [
        `no page "${name}": a page is a directory under src/pages with ${name}.html in it`,
      ],
    };
  }
  const inside = (file: string) =>
    readInside(root.path, isAbsolute(file) ? file : join(root.path, file));
  let template: string;
  let policy: PagePolicy;
  try {
    template = inside(page.template);
    policy = page.declaration === undefined ? NONE : readPagePolicy(inside(page.declaration));
  } catch (error) {
    return {
      html: "",
      diagnostics: [],
      problems: [
        `page "${name}" could not be read: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
  const plan = pagePlan({ route: page.route, template, place: pagePlacements(policy) });
  return composeTemplate(root, template, plan);
}
