// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { compose } from "@assemblejs/core";
import type { AssemblyPlan, Fetch } from "@assemblejs/core";
import { renderAssembly } from "../render/render-assembly.js";
import type { ProjectRoot } from "../root/project-root.js";
import type { ComposedPage } from "./composed-page.js";

/**
 * Composes a page template NOW, resolving each placement against the project on disk.
 *
 * The second half of the agent's loop: it writes a template, and sees the page, with one
 * diagnostic per placement saying which rung answered. A placement that fell back looks
 * identical to one that worked in the html alone, which is exactly why the account comes back
 * with it rather than instead of it.
 */
export async function composePage(
  root: ProjectRoot,
  template: string,
  plan: Readonly<Record<string, AssemblyPlan>> = {},
): Promise<ComposedPage> {
  const problems: string[] = [];

  // Every placement is answered from the project on disk. No HTTP: an agent asking what this
  // page looks like should not need a port, and a remote assembly is not this tool's question.
  const fetchLocally: Fetch = async (request) => {
    const rendered = renderAssembly(root, request.name);
    if (rendered.problems.length > 0) {
      problems.push(...rendered.problems);
      return {
        ok: false,
        reason: "invalid",
        detail: rendered.problems.join("; "),
        correlationId: "",
      };
    }
    return { ok: true, html: rendered.html, source: "local" };
  };

  let sequence = 0;
  try {
    const { html, diagnostics } = await compose({
      template,
      plan,
      fetch: fetchLocally,
      page: "preview",
      newId: () => `preview-${(sequence += 1)}`,
      now: () => 0,
    });
    return { html, diagnostics, problems };
  } catch (error) {
    // A template the composer refuses is the agent's own mistake to fix, so it comes back as a
    // problem rather than as a thrown error it has to catch.
    return {
      html: "",
      diagnostics: [],
      problems: [...problems, error instanceof Error ? error.message : String(error)],
    };
  }
}
