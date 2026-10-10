// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_VIEW } from "@assemblejs/core";
import { collectPlacements } from "./collect-placements.js";
import { importedAs } from "./imported-as.js";
import type { ViewPlacements } from "./view-placements.js";

const TEMPLATE = /<template\b[^>]*>([\s\S]*)<\/template\s*>/i;
// An attribute written as a string, and one bound to an expression.
const written = (attributes: string, name: string): string | undefined =>
  new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes)?.[1];
const bound = (attributes: string, name: string): boolean =>
  new RegExp(`(?:^|\\s)(?::|v-bind:)${name}\\s*=`).test(attributes);

/**
 * The slots a Vue component's template places, read from its source as text: every
 * `<Slot name="...">` of the renderer's `Slot`, under whatever name the script imports it. A
 * view written as a string is read; one that is bound is left out of the placement; a name
 * that is bound, or missing, is reported.
 */
export function vuePlacements(source: string): ViewPlacements {
  const template = TEMPLATE.exec(source)?.[1] ?? "";
  const found: { name: string | undefined; view: string | undefined; shown: string }[] = [];
  for (const local of importedAs(source, "Slot")) {
    const tag = new RegExp(`<${local}\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`, "g");
    for (const [shown, attributes = ""] of template.matchAll(tag)) {
      found.push({
        name: written(attributes, "name"),
        view: bound(attributes, "view") ? undefined : (written(attributes, "view") ?? DEFAULT_VIEW),
        shown,
      });
    }
  }
  return collectPlacements(found);
}
