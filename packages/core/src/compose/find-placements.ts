// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { PLACEMENT_ELEMENT } from "../vocab/placement-element.js";
import { SEGMENT } from "../vocab/segment.js";
import type { Placement } from "./placement.js";

// The directive has a shape this product defines, so it is matched exactly rather than parsed:
// an opening tag with only the attributes named below, quoted, then either a self-closing slash
// or an immediately following closing tag. Anything else is refused by name rather than
// half-understood, which is the failure mode a lenient regex over markup always has.
// Case insensitive, because HTML tag names are. Matching only the lower case spelling meant
// <ASSEMBLY name="cart"/> was not a directive at all: it was copied into the output verbatim
// and no diagnostic said so, which is the silent drop this file exists to prevent.
const DIRECTIVE = new RegExp(
  `<${PLACEMENT_ELEMENT}(\\s[^>]*?)?\\s*(/?)>(?:\\s*</${PLACEMENT_ELEMENT}\\s*>)?`,
  "gi",
);
const COMMENT = /<!--[\s\S]*?-->/g;
// The elements whose content the parser reads as text, never as tags. A directive inside one is
// not a placement: splicing a child there would put the child's island `</script>` inside an
// open script and end it early, the same early end a directive in a comment would cause.
const RAW_TEXT = /<(script|style|textarea|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
// A name or view is the same shape a declared assembly must have (SEGMENT): a template naming
// something that could never be declared is a mistake worth reporting, and a name carrying the
// identity separator would make two different assemblies share one identity and one cache key.
const ATTRIBUTE = /([a-z-]+)\s*=\s*"([^"]*)"/g;
const ALLOWED = new Set(["name", "view"]);

/**
 * Every placement in a template, in the order it appears.
 *
 * Throws on a directive it does not fully understand. A page whose template names an attribute
 * this version does not know is a page that would silently drop it, and a silent drop is found
 * by a visitor rather than by a build.
 */
export function findPlacements(template: string): Placement[] {
  const found: Placement[] = [];
  const inert: Array<readonly [number, number]> = [];
  for (const pattern of [COMMENT, RAW_TEXT]) {
    pattern.lastIndex = 0;
    for (const span of template.matchAll(pattern)) {
      inert.push([span.index, span.index + span[0].length]);
    }
  }
  const isInert = (at: number): boolean => inert.some(([from, to]) => at >= from && at < to);

  DIRECTIVE.lastIndex = 0;
  for (const match of template.matchAll(DIRECTIVE)) {
    const [directive, rawAttributes = "", selfClosing] = match;
    const start = match.index;
    // A directive inside a comment or a raw-text element is not a placement. Dispatching one
    // fetches an assembly the author commented out or quoted, and splices its markup where a
    // "-->" or "</script>" inside it ends the enclosing text early and the rest becomes live.
    if (isInert(start)) continue;
    const closed = /<\/[a-z]+\s*>$/i.test(directive) || selfClosing === "/";
    if (!closed) {
      throw new Error(
        `<${PLACEMENT_ELEMENT}> at ${start} is neither self-closing nor immediately closed`,
      );
    }

    const attributes = new Map<string, string>();
    ATTRIBUTE.lastIndex = 0;
    for (const attribute of rawAttributes.matchAll(ATTRIBUTE)) {
      const [, key = "", value = ""] = attribute;
      if (!ALLOWED.has(key)) {
        throw new Error(
          `<${PLACEMENT_ELEMENT}> at ${start} carries an unknown attribute "${key}"; only ${[...ALLOWED].join(" and ")} are understood`,
        );
      }
      // Last-wins on a repeated attribute is a silent choice between two things the author
      // wrote, and the one that loses is invisible.
      if (attributes.has(key)) {
        throw new Error(
          `<${PLACEMENT_ELEMENT}> at ${start} names the attribute "${key}" more than once`,
        );
      }
      attributes.set(key, value);
    }

    const leftover = rawAttributes.replace(ATTRIBUTE, "").trim();
    if (leftover.length > 0) {
      throw new Error(
        `<${PLACEMENT_ELEMENT}> at ${start} has an attribute this version cannot read: ${leftover}`,
      );
    }

    const name = attributes.get("name");
    if (name === undefined || name.length === 0) {
      throw new Error(`<${PLACEMENT_ELEMENT}> at ${start} has no name`);
    }
    const view = attributes.get("view") ?? "default";
    for (const [what, value] of [
      ["name", name],
      ["view", view],
    ] as const) {
      if (!SEGMENT.test(value)) {
        throw new Error(
          `<${PLACEMENT_ELEMENT}> at ${start} has a ${what} "${value}" that is not a usable ` +
            `url segment; names are lower case, start with a letter, and cannot contain "/"`,
        );
      }
    }
    found.push({ name, view, start, end: start + directive.length });
  }
  return found;
}
