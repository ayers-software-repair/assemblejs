// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredPage } from "../discovery/discovered-page.js";
import { NOT_FOUND_PAGE } from "../discovery/not-found-page.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";
import { importOf } from "./import-of.js";

/**
 * The module the built server imports its pages from. Each page is its template, read at build
 * time, joined to what its own file declares; a route the file gives wins over the one the
 * directory implies. The not-found page, where the project has one, is exported apart as
 * `notFound`, with no route: it is served at no address of its own.
 */
export function generatePages(pages: readonly DiscoveredPage[], from: string): string {
  const imports: string[] = [];
  const fieldsOf = (page: DiscoveredPage): string[] => {
    const template = identifierFor("template", page.name);
    imports.push(importOf(template, from, page.template));
    const fields: string[] = [];
    if (page.declaration !== undefined) {
      const declared = identifierFor("page", page.name);
      imports.push(importOf(declared, from, page.declaration));
      fields.push(`...${declared}`);
    }
    fields.push(`template: ${template}`);
    return fields;
  };
  const entries = pages
    .filter((page) => page.name !== NOT_FOUND_PAGE)
    .map(
      (page) => `  { ${[`route: ${JSON.stringify(page.route)}`, ...fieldsOf(page)].join(", ")} },`,
    );
  const notFound = pages.find((page) => page.name === NOT_FOUND_PAGE);
  const exported =
    notFound === undefined
      ? ""
      : `\nexport const notFound: Omit<PageDefinition, "route"> = { ${fieldsOf(notFound).join(", ")} };\n`;
  return `${GENERATED_HEADER}
import type { PageDefinition } from "@assemblejs/core";
${imports.join("\n")}

export const pages: readonly PageDefinition[] = [
${entries.join("\n")}
];
${exported}`;
}
