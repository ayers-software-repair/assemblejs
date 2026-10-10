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

// The ways a template may write a component it imported under this name: the name, and its
// kebab-case form, which Vue resolves as well. For `Slot` itself that form is the native
// outlet's, and a name under a namespace has no other.
const writtenAs = (local: string): readonly string[] => {
  const kebab = local.replace(/\B([A-Z])/g, "-$1").toLowerCase();
  return local.includes(".") || kebab === local || kebab === "slot" ? [local] : [local, kebab];
};

/**
 * The slots a Vue component's template places, read from its source as text: every
 * `<Slot name="...">` of the renderer's `Slot`, under whatever name the script imports it, in
 * that name's kebab case, or under the namespace the whole client is imported as. A view
 * written as a string is read; one that is bound is left out of the placement; a name that is
 * bound, or missing, is reported.
 */
export function vuePlacements(source: string): ViewPlacements {
  const template = TEMPLATE.exec(source)?.[1] ?? "";
  const found: { name: string | undefined; view: string | undefined; shown: string }[] = [];
  for (const local of importedAs(source, "Slot")) {
    // A name under a namespace holds a dot, which is the one character of it a pattern reads.
    const names = writtenAs(local).map((name) => name.replace(".", "\\."));
    const tag = new RegExp(`<(?:${names.join("|")})(?![\\w-])((?:[^>"']|"[^"]*"|'[^']*')*)>`, "g");
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
