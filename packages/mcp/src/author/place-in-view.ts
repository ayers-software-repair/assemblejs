// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { discoverAssemblies, placeAssembly, realIo, viewFindings } from "@assemblejs/cli";
import type { PlacementPosition, ProjectProblem } from "@assemblejs/cli";
import { isOccupied } from "../root/is-occupied.js";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";
import { leadsTo } from "./leads-to.js";

// The views that hold the directive as markup, which this tool can write it into.
const HOLDS_THE_DIRECTIVE: readonly string[] = ["html", "ejs", "handlebars", "nunjucks"];

// What its author writes by hand in any other view, which only they know where to put.
const byHand = (renderer: string, name: string): string => {
  const client = `"@assemblejs/renderer-${renderer}/client"`;
  if (renderer === "markdown") {
    return `a Markdown view is prose and places nothing: place "${name}" from a page or from an html view`;
  }
  if (renderer === "pug") {
    return `write assembly(name="${name}") on a line of its own, indented under the element that holds it`;
  }
  if (renderer === "svelte") {
    return `import { slot } from ${client}, then write {@html slot("${name}")} where the child should stand`;
  }
  if (renderer === "lit") {
    return `import { slot } from ${client}, then write \${slot("${name}")} in the view's template where the child should stand`;
  }
  return `import { Slot } from ${client}, then write <Slot name="${name}" /> where the child should stand`;
};

/**
 * Places one assembly in another's view: a child in a parent. A view that holds the directive
 * as markup gets it written in, at a named position, as a page's template does. Any other view
 * is its author's source, so the answer is the one line to write and where it is imported from,
 * never an edit that guesses where in a component a child belongs. A child that already leads
 * to the parent, at any depth, is refused before anything is written.
 */
export function placeInView(
  root: ProjectRoot,
  parent: string,
  name: string,
  position: PlacementPosition,
): ToolResult {
  const assemblies = discoverAssemblies(root.path).assemblies;
  const names = assemblies.map((assembly) => assembly.name).join(", ") || "none yet";
  const refused = (problem: ProjectProblem): ToolResult => ({
    ok: false,
    result: null,
    problems: [problem],
  });
  const missing = [parent, name].find(
    (wanted) => !assemblies.some((assembly) => assembly.name === wanted),
  );
  if (missing !== undefined) {
    return refused({
      path: "src/assemblies",
      rule: "a-placement-names-an-assembly",
      message: `there is no assembly "${missing}"`,
      // A directory of that name that is not an assembly is taken, and add_assembly would
      // refuse it: told to add it, an agent goes round between the two.
      fix: isOccupied(withinRoot(root, "src", "assemblies", missing))
        ? `src/assemblies/${missing} is there and is not an assembly yet: mend what is said of that directory`
        : `add it with add_assembly first, or use one that exists: ${names}`,
    });
  }
  const file = `src/assemblies/${parent}/${
    assemblies
      .find((assembly) => assembly.name === parent)
      ?.view.split("/")
      .at(-1) ?? ""
  }`;
  const renderer = assemblies.find((assembly) => assembly.name === parent)?.renderer ?? "";
  if (parent === name) {
    return refused({
      path: file,
      rule: "an-assembly-is-never-its-own-ancestor",
      message: `"${name}" cannot be placed inside itself`,
      fix: `place another assembly in it: ${names}`,
    });
  }
  // At any depth: a child that already leads to the parent would make the parent its own
  // ancestor, which every render refuses and a tool should not write and call done.
  const chain = leadsTo(viewFindings(root.path, assemblies).placements, name, parent);
  if (chain !== undefined) {
    return refused({
      path: file,
      rule: "an-assembly-is-never-its-own-ancestor",
      message: `"${name}" already holds "${parent}" (${chain.join(", ")}), so it cannot be placed inside it`,
      fix: `place another assembly in it, or take "${parent}" out of what "${name}" places`,
    });
  }
  if (!HOLDS_THE_DIRECTIVE.includes(renderer)) {
    return refused({
      path: file,
      rule: "a-view-places-a-child-with-the-directive",
      message: `"${parent}" is a ${renderer} view, which its author writes: this tool does not edit it`,
      fix: byHand(renderer, name),
    });
  }
  const placed = placeAssembly(readFileSync(withinRoot(root, file), "utf8"), name, position, file);
  if ("problem" in placed) return refused(placed.problem);
  realIo.write(withinRoot(root, file), placed.template);
  return {
    ok: true,
    result: {
      written: [file],
      inserted: `<assembly name="${name}"></assembly>`,
      placed: placed.placed,
      template: placed.template,
    },
    problems: [],
    next: [
      ...(placed.placed > 1
        ? [
            `"${name}" is placed ${String(placed.placed)} times in this view now: take one out if another was not meant`,
          ]
        : []),

      renderer === "html"
        ? `see "${name}" inside it with render_assembly on ${parent}`
        : `build the project to see it: a ${renderer} view renders only through its engine`,
    ],
  };
}
