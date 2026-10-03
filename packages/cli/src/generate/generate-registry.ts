// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { isStaticView } from "../discovery/is-static-view.js";
import { TEMPLATE_RENDERERS } from "../discovery/template-renderers.js";
import type { AssemblyStyles } from "../styles/assembly-styles.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";
import { importPath } from "./import-path.js";

// The package every template language renders through, and the name its one render function is
// imported under.
const TEMPLATE_PACKAGE = "@assemblejs/renderer-templates";
const TEMPLATE_RENDER = "render_template";

/**
 * The module the built server imports its assemblies from, and the author never opens.
 *
 * Every view is imported by name, so the built server has a static import graph and nothing
 * globs a directory at run time. A framework view is wired to its renderer's `renderToMarkup`;
 * a plain html view is its own markup; a template view is its source, rendered by its engine. A
 * framework view's own `mount` and `shadow` exports, when it has them, say when its browser half
 * runs and whether it renders in its own shadow root; a module without one reads as undefined,
 * the default; a view in its own shadow root links the stylesheet built for that root instead of
 * the one scoped to its envelope. An assembly with a browser half links the build's client
 * entry; one without is declared `none`, so it ships no JavaScript at all.
 */
export function generateRegistry(
  assemblies: readonly DiscoveredAssembly[],
  options: {
    /** The directory the generated module is written to. */
    readonly from: string;
    /** The url of the build's client entry, when the build has one. */
    readonly script: string | undefined;
    /** Each assembly's stylesheets, by name, for those that have them. */
    readonly styles?: ReadonlyMap<string, AssemblyStyles>;
    /** Renderer name to the package that renders it on the server. */
    readonly packages: Readonly<Record<string, string>>;
  },
): string {
  const imports: string[] = [];
  const renderers = new Set<string>();
  let templates: string | undefined;
  const entries = assemblies.map((assembly) => {
    const view = identifierFor("view", assembly.name);
    const html = isStaticView(assembly.renderer);
    const template = TEMPLATE_RENDERERS.includes(assembly.renderer);
    imports.push(
      html
        ? `import ${view} from "${importPath(options.from, assembly.view)}";`
        : `import * as ${view} from "${importPath(options.from, assembly.view)}";`,
    );
    if (!html) renderers.add(assembly.renderer);
    if (template) templates = options.packages[assembly.renderer] ?? TEMPLATE_PACKAGE;

    const fields = [`renderer: "${assembly.renderer}"`];
    if (assembly.service !== undefined) {
      const service = identifierFor("service", assembly.name);
      imports.push(`import ${service} from "${importPath(options.from, assembly.service)}";`);
      fields.push(`services: [${service}]`);
    }
    fields.push(
      template
        ? `markup: (input) => ${TEMPLATE_RENDER}("${assembly.renderer}", ${view}, input)`
        : html
          ? `markup: () => ${view}`
          : `markup: (input) => ${identifierFor("render", assembly.renderer)}(${view}.default, input)`,
    );

    const parts = [`name: "${assembly.name}"`, `views: { default: { ${fields.join(", ")} } }`];
    const browser = !html || assembly.client !== undefined;
    if (!browser) parts.push(`mount: "none"`);
    else if (!html) parts.push(`mount: ${view}.mount`, `shadow: ${view}.shadow`);
    const styles = options.styles?.get(assembly.name);
    const css =
      styles === undefined
        ? ""
        : styles.shadow === undefined
          ? JSON.stringify(styles.scoped)
          : `${view}.shadow === true ? ${JSON.stringify(styles.shadow)} : ${JSON.stringify(styles.scoped)}`;
    const js = browser ? options.script : undefined;
    if (css !== "" || js !== undefined) {
      parts.push(`assets: { css: [${css}], js: [${js === undefined ? "" : JSON.stringify(js)}] }`);
    }
    return `  { ${parts.join(", ")} },`;
  });

  const rendererImports = [...renderers].sort().map((renderer) => {
    const from = options.packages[renderer] ?? `@assemblejs/renderer-${renderer}`;
    return `import { renderToMarkup as ${identifierFor("render", renderer)} } from "${from}";`;
  });
  if (templates !== undefined) {
    rendererImports.push(`import { renderTemplate as ${TEMPLATE_RENDER} } from "${templates}";`);
  }

  return `${GENERATED_HEADER}
import type { AssemblyDefinition } from "@assemblejs/core";
${[...rendererImports, ...imports].join("\n")}

export const assemblies: readonly AssemblyDefinition[] = [
${entries.join("\n")}
];
`;
}
