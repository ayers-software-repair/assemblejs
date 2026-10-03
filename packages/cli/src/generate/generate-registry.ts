// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";
import { importPath } from "./import-path.js";

/**
 * The module the built server imports its assemblies from, and the author never opens.
 *
 * Every view is imported by name, so the built server has a static import graph and nothing
 * globs a directory at run time. A framework view is wired to its renderer's `renderToMarkup`;
 * a plain html view is its own markup. A framework view's own `mount` export, when it has one,
 * says when its browser half runs; a module without one reads as undefined, the default. An
 * assembly with a browser half links the build's client entry; one without is declared `none`,
 * so it ships no JavaScript at all.
 */
export function generateRegistry(
  assemblies: readonly DiscoveredAssembly[],
  options: {
    /** The directory the generated module is written to. */
    readonly from: string;
    /** The url of the build's client entry, when the build has one. */
    readonly script: string | undefined;
    /** Renderer name to the package that renders it on the server. */
    readonly packages: Readonly<Record<string, string>>;
  },
): string {
  const imports: string[] = [];
  const renderers = new Set<string>();
  const entries = assemblies.map((assembly) => {
    const view = identifierFor("view", assembly.name);
    const html = assembly.renderer === "html";
    imports.push(
      html
        ? `import ${view} from "${importPath(options.from, assembly.view)}";`
        : `import * as ${view} from "${importPath(options.from, assembly.view)}";`,
    );
    if (!html) renderers.add(assembly.renderer);

    const fields = [`renderer: "${assembly.renderer}"`];
    if (assembly.service !== undefined) {
      const service = identifierFor("service", assembly.name);
      imports.push(`import ${service} from "${importPath(options.from, assembly.service)}";`);
      fields.push(`services: [${service}]`);
    }
    fields.push(
      html
        ? `markup: () => ${view}`
        : `markup: (input) => ${identifierFor("render", assembly.renderer)}(${view}.default, input)`,
    );

    const parts = [`name: "${assembly.name}"`, `views: { default: { ${fields.join(", ")} } }`];
    const browser = !html || assembly.client !== undefined;
    if (!browser) parts.push(`mount: "none"`);
    else if (!html) parts.push(`mount: ${view}.mount`);
    if (browser && options.script !== undefined) {
      parts.push(`assets: { css: [], js: [${JSON.stringify(options.script)}] }`);
    }
    return `  { ${parts.join(", ")} },`;
  });

  const rendererImports = [...renderers].sort().map((renderer) => {
    const from = options.packages[renderer] ?? `@assemblejs/renderer-${renderer}`;
    return `import { renderToMarkup as ${identifierFor("render", renderer)} } from "${from}";`;
  });

  return `${GENERATED_HEADER}
import type { AssemblyDefinition } from "@assemblejs/core";
${[...rendererImports, ...imports].join("\n")}

export const assemblies: readonly AssemblyDefinition[] = [
${entries.join("\n")}
];
`;
}
