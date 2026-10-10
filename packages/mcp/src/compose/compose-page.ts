// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_LIMITS, compose, localFetch } from "@assemblejs/core";
import type { AssemblyPlan, LogLine } from "@assemblejs/core";
import { projectAssemblies } from "../render/project-assemblies.js";
import type { ProjectRoot } from "../root/project-root.js";
import type { ComposedPage } from "./composed-page.js";
import { fallbackProblems } from "./fallback-problems.js";

/**
 * Composes a page template NOW, resolving each placement against the project on disk through
 * the transport a server composes with, so an assembly's own placements are composed inside it
 * as they will be when it is served.
 *
 * The second half of the agent's loop: it writes a template, and sees the page, with one
 * diagnostic per placement saying which rung answered, and beneath it one per assembly that
 * placement's view placed. A placement that fell back looks identical to one that worked in the
 * html alone, which is exactly why the account comes back with it rather than instead of it.
 *
 * No HTTP: an agent asking what this page looks like should not need a port, and a remote
 * assembly is not this tool's question.
 */
export async function composePage(
  root: ProjectRoot,
  template: string,
  plan: Readonly<Record<string, AssemblyPlan>> = {},
): Promise<ComposedPage> {
  const assemblies = projectAssemblies(root);
  const logged: LogLine[] = [];
  let sequence = 0;
  try {
    const { html, diagnostics } = await compose({
      template,
      plan,
      fetch: localFetch(assemblies, (line) => logged.push(line), DEFAULT_LIMITS),
      limits: DEFAULT_LIMITS,
      page: "preview",
      newId: () => `preview-${(sequence += 1)}`,
      now: () => 0,
    });
    return {
      html,
      diagnostics,
      problems: fallbackProblems(diagnostics, [...assemblies.keys()], logged),
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
