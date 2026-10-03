// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import type { ProjectProblem } from "../discovery/project-problem.js";
import type { PlacementPosition } from "./placement-position.js";

const BODY_OPEN = /<body\b[^>]*>/i;
const BODY_CLOSE = /<\/body\s*>/i;

/**
 * A page template with one more placement in it, at a named position, or why it cannot be put
 * there. Beside a neighbour means beside that assembly's directive; a neighbour the template
 * does not place is a problem that lists the ones it does, never a guess at where it meant.
 */
export function placeAssembly(
  template: string,
  name: string,
  position: PlacementPosition,
  path: string,
): { readonly template: string } | { readonly problem: ProjectProblem } {
  const tag = `<assembly name="${name}"></assembly>`;
  if ("at" in position) {
    const open = BODY_OPEN.exec(template);
    const close = BODY_CLOSE.exec(template);
    if (position.at === "start") {
      const at = open === null ? 0 : open.index + open[0].length;
      return { template: `${template.slice(0, at)}\n${tag}${template.slice(at)}` };
    }
    const at = close === null ? template.length : close.index;
    return { template: `${template.slice(0, at)}${tag}\n${template.slice(at)}` };
  }

  const neighbour = "after" in position ? position.after : position.before;
  let placements;
  try {
    placements = findPlacements(template);
  } catch (error) {
    return {
      problem: {
        path,
        rule: "a-placement-names-an-assembly",
        message: error instanceof Error ? error.message : String(error),
        fix: 'write each placement as <assembly name="..."></assembly>',
      },
    };
  }
  const found = placements.find((placement) => placement.name === neighbour);
  if (found === undefined) {
    const placed = placements.map((placement) => placement.name);
    return {
      problem: {
        path,
        rule: "a-placement-names-an-assembly",
        message: `the template does not place "${neighbour}"`,
        fix:
          placed.length === 0
            ? 'it places nothing yet; use { "at": "end" }'
            : `place it beside one it does: ${placed.join(", ")}`,
      },
    };
  }
  return "after" in position
    ? { template: `${template.slice(0, found.end)}\n${tag}${template.slice(found.end)}` }
    : { template: `${template.slice(0, found.start)}${tag}\n${template.slice(found.start)}` };
}
