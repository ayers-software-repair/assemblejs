// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { PLACEMENT_ELEMENT } from "../vocab/placement-element.js";
import type { Placement } from "./placement.js";

// The directive has a shape this product defines, so it is matched exactly rather than parsed:
// an opening tag with only the attributes named below, quoted, then either a self-closing slash
// or an immediately following closing tag. Anything else is refused by name rather than
// half-understood, which is the failure mode a lenient regex over markup always has.
const DIRECTIVE = new RegExp(
  `<${PLACEMENT_ELEMENT}(\\s[^>]*?)?\\s*(/?)>(?:\\s*</${PLACEMENT_ELEMENT}\\s*>)?`,
  "g",
);
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
  DIRECTIVE.lastIndex = 0;
  for (const match of template.matchAll(DIRECTIVE)) {
    const [directive, rawAttributes = "", selfClosing] = match;
    const start = match.index;
    const closed = directive.endsWith(`</${PLACEMENT_ELEMENT}>`) || selfClosing === "/";
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
    found.push({
      name,
      view: attributes.get("view") ?? "default",
      start,
      end: start + directive.length,
    });
  }
  return found;
}
