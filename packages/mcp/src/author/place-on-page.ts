// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { discoverAssemblies, discoverPages, placeAssembly, realIo } from "@assemblejs/cli";
import type { PlacementPosition } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";

/**
 * Puts one placement into one page's template at a named position, and answers with the file it
 * changed and what it inserted. It knows what it cannot know: a page or an assembly that does not
 * exist comes back as a problem listing the ones that do, never as one created to fit.
 */
export function placeOnPage(
  root: ProjectRoot,
  page: string,
  name: string,
  position: PlacementPosition,
): ToolResult {
  const pages = discoverPages(root.path).pages;
  const found = pages.find((candidate) => candidate.name === page);
  if (found === undefined) {
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: "src/pages",
          rule: "a-directory-is-a-page",
          message: `there is no page "${page}"`,
          fix:
            pages.length === 0
              ? `this project has no pages yet; add src/pages/${page}/${page}.html`
              : `place it on one that exists: ${pages.map((candidate) => candidate.name).join(", ")}`,
        },
      ],
    };
  }
  const assemblies = discoverAssemblies(root.path).assemblies;
  if (!assemblies.some((assembly) => assembly.name === name)) {
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: "src/assemblies",
          rule: "a-placement-names-an-assembly",
          message: `there is no assembly "${name}"`,
          fix: `add it with add_assembly first, or place one that exists: ${assemblies.map((assembly) => assembly.name).join(", ") || "none yet"}`,
        },
      ],
    };
  }
  const file = `src/pages/${page}/${page}.html`;
  const placed = placeAssembly(readFileSync(withinRoot(root, file), "utf8"), name, position, file);
  if ("problem" in placed) return { ok: false, result: null, problems: [placed.problem] };
  realIo.write(withinRoot(root, file), placed.template);
  return {
    ok: true,
    result: {
      written: [file],
      inserted: `<assembly name="${name}"></assembly>`,
      template: placed.template,
    },
    problems: [],
    next: [`see the page with compose_page on ${file}`],
  };
}
