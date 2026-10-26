// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { dirname, relative, sep } from "node:path";
import type { ViewPlacement } from "@asmjs/core";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { isStaticView } from "../discovery/is-static-view.js";
import { TEMPLATE_RENDERERS } from "../discovery/template-renderers.js";
import type { AssemblyStyles } from "../styles/assembly-styles.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";
import { importOf } from "./import-of.js";

// A view's path from the project root, which the generated module's directory sits in: what a
// template's errors name it by.
const projectPath = (from: string, file: string): string =>
  relative(dirname(from), file).split(sep).join("/");

// The package every template language renders through, and the name its one render function is
// imported under.
const TEMPLATE_PACKAGE = "@asmjs/renderer-templates";
const TEMPLATE_RENDER = "render_template";

// How the registry reads what a framework view says of itself. A view may export `mount` and
// `shadow` and most export neither, and a property read off a module that does not export it
// is an error to the compiler. Read through this, one that is missing is undefined, as it is
// when the module runs, and one that is there is still held to the type the definition gives.
const SAID = "said";
const SAYS = `
type ViewModule = {
  readonly default: unknown;
  readonly mount?: AssemblyDefinition["mount"];
  readonly shadow?: AssemblyDefinition["shadow"];
};
const ${SAID} = (view: ViewModule): ViewModule => view;
`;

/**
 * The module the built server imports its assemblies from, and the author never opens.
 *
 * Every view is imported by name, so the built server has a static import graph and nothing
 * globs a directory at run time. A framework view is wired to its renderer's `renderToMarkup`;
 * a plain html view is its own markup; a template view is its source, rendered by its engine. A
 * framework view's own `mount` and `shadow` exports, when it has them, say when its browser half
 * runs and whether it renders in its own shadow root; a module without one reads as undefined,
 * the default, and is read so that a project that type-checks is not failed for the export it
 * left out; a view in its own shadow root links the stylesheet built for that root instead of
 * the one scoped to its envelope. An assembly with a browser half links the build's client
 * entry; one without is declared `none`, so it ships no JavaScript at all. What a view's source
 * is known to place is written beside it, for boot to hold and to link ahead of a deferral.
 *
 * One module of the registry: the whole of it for a project with no JSX, or one owner's part,
 * exported under that owner's name, or the part of no owner's, which spreads the owners' in.
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
    /** What each assembly's view is known to place, by name, for those whose source says. */
    readonly placements?: ReadonlyMap<string, readonly ViewPlacement[]>;
    /** The name the list is exported under; `assemblies`, the server's, unless told otherwise. */
    readonly exported?: string;
    /** The owners of JSX whose own modules, `assemblies.<owner>.ts`, this list spreads in. */
    readonly spread?: readonly string[];
  },
): string {
  const imports: string[] = [];
  const renderers = new Set<string>();
  let templates: string | undefined;
  const entries = assemblies.map((assembly) => {
    const view = identifierFor("view", assembly.name);
    const html = isStaticView(assembly.renderer);
    const template = TEMPLATE_RENDERERS.includes(assembly.renderer);
    imports.push(importOf(html ? view : `* as ${view}`, options.from, assembly.view));
    if (!html) renderers.add(assembly.renderer);
    if (template) templates = options.packages[assembly.renderer] ?? TEMPLATE_PACKAGE;

    const fields = [`renderer: "${assembly.renderer}"`];
    if (assembly.service !== undefined) {
      const service = identifierFor("service", assembly.name);
      imports.push(importOf(service, options.from, assembly.service));
      fields.push(`services: [${service}]`);
    }
    fields.push(
      template
        ? `markup: (input) => ${TEMPLATE_RENDER}("${assembly.renderer}", ${view}, input, ${JSON.stringify(projectPath(options.from, assembly.view))})`
        : html
          ? `markup: () => ${view}`
          : `markup: (input) => ${identifierFor("render", assembly.renderer)}(${view}.default, input)`,
    );
    const placed = options.placements?.get(assembly.name);
    if (placed !== undefined) fields.push(`placements: ${JSON.stringify(placed)}`);

    const parts = [`name: "${assembly.name}"`, `views: { default: { ${fields.join(", ")} } }`];
    const browser = !html || assembly.client !== undefined;
    if (!browser) parts.push(`mount: "none"`);
    else if (!html) parts.push(`mount: ${SAID}(${view}).mount`, `shadow: ${SAID}(${view}).shadow`);
    const styles = options.styles?.get(assembly.name);
    const css =
      styles === undefined
        ? ""
        : styles.shadow === undefined
          ? JSON.stringify(styles.scoped)
          : `${SAID}(${view}).shadow === true ? ${JSON.stringify(styles.shadow)} : ${JSON.stringify(styles.scoped)}`;
    const js = browser ? options.script : undefined;
    if (css !== "" || js !== undefined) {
      parts.push(`assets: { css: [${css}], js: [${js === undefined ? "" : JSON.stringify(js)}] }`);
    }
    return `  { ${parts.join(", ")} },`;
  });

  const rendererImports = [...renderers].sort().map((renderer) => {
    const from = options.packages[renderer] ?? `@asmjs/renderer-${renderer}`;
    return `import { renderToMarkup as ${identifierFor("render", renderer)} } from "${from}";`;
  });
  if (templates !== undefined) {
    rendererImports.push(`import { renderTemplate as ${TEMPLATE_RENDER} } from "${templates}";`);
  }

  const spread = options.spread ?? [];
  const spreadImports = spread.map(
    (owner) => `import { assemblies_${owner} } from "./assemblies.${owner}.js";`,
  );
  const spreadEntries = spread.map((owner) => `  ...assemblies_${owner},`);

  return `${GENERATED_HEADER}
import type { AssemblyDefinition } from "@asmjs/core";
${[...rendererImports, ...spreadImports, ...imports].join("\n")}
${entries.some((entry) => entry.includes(`${SAID}(`)) ? SAYS : ""}
export const ${options.exported ?? "assemblies"}: readonly AssemblyDefinition[] = [
${[...entries, ...spreadEntries].join("\n")}
];
`;
}
