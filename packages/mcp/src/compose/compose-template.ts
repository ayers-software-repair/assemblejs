// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import { DEFAULT_LIMITS, compose, localFetch } from "@assemblejs/core";
import type { AssemblyPlan, LogLine } from "@assemblejs/core";
import { devServerFetch } from "../render/dev-server-fetch.js";
import { devServerUrl } from "../render/dev-server-url.js";
import { projectAssemblies } from "../render/project-assemblies.js";
import type { ProjectRoot } from "../root/project-root.js";
import type { ArrivedWith } from "./arrived-with.js";
import type { ComposedPage } from "./composed-page.js";
import { fallbackProblems } from "./fallback-problems.js";

/**
 * Composes a page's template NOW under a plan, resolving each placement against the project on
 * disk through the transport a server composes with, so an assembly's own placements are
 * composed inside it as they will be when it is served.
 *
 * The second half of the agent's loop: it writes a page, and sees it, with one diagnostic per
 * placement saying which rung answered, and beneath it one per assembly that placement's view
 * placed. A placement that fell back looks identical to one that worked in the html alone, which
 * is exactly why the account comes back with it rather than instead of it.
 *
 * While the project's own dev server runs, every placement is asked of it instead, so the page
 * is what the project serves, framework views included, and nothing of the project's code runs
 * here (DESIGN 13.4). Without one there is no HTTP: an agent asking what this page looks like
 * should not need a port, and a remote assembly is not this tool's question.
 *
 * What a visitor arrives with, the route's parameters and the query, is given to every
 * placement's request as a page's composer gives it.
 */
export async function composeTemplate(
  root: ProjectRoot,
  template: string,
  plan: Readonly<Record<string, AssemblyPlan>> = {},
  arrived: ArrivedWith = {},
): Promise<ComposedPage> {
  const assemblies = projectAssemblies(root);
  const logged: LogLine[] = [];
  const inside: string[] = [];
  const dev = await devServerUrl(root);
  try {
    const { html, diagnostics } = await compose({
      template,
      plan,
      fetch:
        dev === undefined
          ? localFetch(assemblies, (line) => logged.push(line), DEFAULT_LIMITS)
          : devServerFetch(
              dev,
              (line) => logged.push(line),
              (problem) => inside.push(problem),
            ),
      limits: DEFAULT_LIMITS,
      params: arrived.params ?? {},
      query: new URLSearchParams(arrived.query),
      // The ids a page's composer sends, which the content endpoint holds to their shape and
      // refuses a request without (DESIGN 2.1).
      page: randomUUID(),
      newId: randomUUID,
      now: () => 0,
    });
    return {
      html,
      diagnostics,
      problems: fallbackProblems(diagnostics, [...assemblies.keys()], logged, inside),
    };
  } catch (error) {
    // A template the composer refuses is the agent's own mistake to fix, so it comes back as a
    // problem rather than as a thrown error it has to catch.
    return {
      html: "",
      diagnostics: [],
      problems: [error instanceof Error ? error.message : String(error)],
    };
  }
}
