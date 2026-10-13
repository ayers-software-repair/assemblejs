// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { jsxOwner } from "../discovery/jsx-owner.js";
import { generateRegistry } from "./generate-registry.js";

/**
 * The registry the built server imports, as the modules it is written in: one for each owner
 * of JSX the assemblies have, holding that owner's views and the typed render calls on them,
 * and `assemblies.ts`, holding every other view and spreading the owners' modules into the one
 * list the server reads. Split so each module is in its owner's TypeScript project: a module
 * that imports a React view and a Solid view can be in neither's, and an editor shows an error
 * in it against whichever it is not.
 */
export function generateRegistries(
  assemblies: readonly DiscoveredAssembly[],
  options: Parameters<typeof generateRegistry>[1],
): Readonly<Record<string, string>> {
  const owners = [
    ...new Set(assemblies.flatMap((assembly) => jsxOwner(assembly.renderer) ?? [])),
  ].sort();
  const modules: Record<string, string> = {};
  for (const owner of owners) {
    modules[`assemblies.${owner}.ts`] = generateRegistry(
      assemblies.filter((assembly) => jsxOwner(assembly.renderer) === owner),
      { ...options, exported: `assemblies_${owner}` },
    );
  }
  modules["assemblies.ts"] = generateRegistry(
    assemblies.filter((assembly) => jsxOwner(assembly.renderer) === undefined),
    { ...options, spread: owners },
  );
  return modules;
}
