// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredPage } from "../discovery/discovered-page.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";
import { importPath } from "./import-path.js";

/**
 * The module the built server imports its pages from. Each page is its template, read at build
 * time, joined to what its own file declares; a route the file gives wins over the one the
 * directory implies.
 */
export function generatePages(pages: readonly DiscoveredPage[], from: string): string {
  const imports: string[] = [];
  const entries = pages.map((page) => {
    const template = identifierFor("template", page.name);
    imports.push(`import ${template} from "${importPath(from, page.template)}";`);
    const fields = [`route: ${JSON.stringify(page.route)}`];
    if (page.declaration !== undefined) {
      const declared = identifierFor("page", page.name);
      imports.push(`import ${declared} from "${importPath(from, page.declaration)}";`);
      fields.push(`...${declared}`);
    }
    fields.push(`template: ${template}`);
    return `  { ${fields.join(", ")} },`;
  });
  return `${GENERATED_HEADER}
import type { PageDefinition } from "@assemblejs/core";
${imports.join("\n")}

export const pages: readonly PageDefinition[] = [
${entries.join("\n")}
];
`;
}
