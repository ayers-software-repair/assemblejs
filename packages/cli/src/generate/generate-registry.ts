// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";

const importPath = (from: string): string => `../${from.replace(/\.tsx?$/, ".js")}`;

/**
 * The module the author never opens.
 *
 * Every assembly is imported by name, so the built server has a static import graph and nothing
 * globs a directory at run time. Generating it is what lets a directory simply BE an assembly
 * while production still behaves like a normal build.
 */
export function generateRegistry(assemblies: readonly DiscoveredAssembly[]): string {
  if (assemblies.length === 0) {
    return `${GENERATED_HEADER}
import type { AssemblyDefinition } from "@assemblejs/core";

export const assemblies: readonly AssemblyDefinition[] = [];
`;
  }

  const imports = assemblies
    .map(
      (assembly) => `import ${identifierFor(assembly.name)} from "${importPath(assembly.view)}";`,
    )
    .join("\n");
  const entries = assemblies
    .map(
      (assembly) =>
        `  { name: ${JSON.stringify(assembly.name)}, views: { default: ${identifierFor(assembly.name)} } },`,
    )
    .join("\n");

  return `${GENERATED_HEADER}
import type { AssemblyDefinition } from "@assemblejs/core";
${imports}

export const assemblies: readonly AssemblyDefinition[] = [
${entries}
];
`;
}
