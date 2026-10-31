// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import { discoverPages, readInside } from "@asmjs/build";
import { pageRoute, readPagePolicy } from "@asmjs/check";
import type { PagePolicy } from "@asmjs/check";
import { pagePlan, routeParameters } from "@asmjs/core";
import type { ProjectRoot } from "../root/project-root.js";
import type { ArrivedWith } from "./arrived-with.js";
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
 *
 * It is composed as for a visitor who arrived with what the call gives: a value for each
 * parameter of the page's route, and a query. A value for a parameter the route has not is
 * refused; a parameter given no value is composed without one and said among the problems.
 */
export async function composePage(
  root: ProjectRoot,
  name: string,
  arrived: ArrivedWith = {},
): Promise<ComposedPage> {
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
  let route: string | undefined;
  try {
    template = inside(page.template);
    policy = page.declaration === undefined ? NONE : await readPagePolicy(inside(page.declaration));
    // The route the page's own file declares, where it declares one: its parameters are what a
    // visitor arrives with. One the file computes is not known here, and nothing is held to it.
    route = await pageRoute(root.path, page);
  } catch (error) {
    return {
      html: "",
      diagnostics: [],
      problems: [
        `page "${name}" could not be read: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
  // A value for a parameter the route does not have is a mistake in the call, and is said
  // before anything is composed with it.
  const named = route === undefined ? undefined : routeParameters(route);
  const unknown =
    named === undefined
      ? []
      : Object.keys(arrived.params ?? {}).filter((given) => !named.includes(given));
  if (unknown.length > 0) {
    return {
      html: "",
      diagnostics: [],
      problems: [
        `the route ${route ?? ""} has no parameter ${unknown.map((given) => `"${given}"`).join(", ")}: ${named === undefined || named.length === 0 ? "it has none" : `it has ${named.join(", ")}`}`,
      ],
    };
  }
  const plan = pagePlan({ route: page.route, template, place: pagePlacements(policy) });
  const composed = await composeTemplate(root, template, plan, arrived);
  // A visitor always arrives with a value for each, so a page composed without one is a page
  // nobody is shown: it is composed all the same, and said.
  const missing = (named ?? []).filter((parameter) => arrived.params?.[parameter] === undefined);
  if (missing.length === 0) return composed;
  return {
    ...composed,
    problems: [
      ...composed.problems,
      `the route ${route ?? ""} was composed with no value for ${missing.join(", ")}: a visitor always arrives with one, so give each in params to see the page one is shown`,
    ],
  };
}
