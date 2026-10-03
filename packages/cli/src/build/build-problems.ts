// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { findPackage } from "./find-package.js";
import { RENDERER_PACKAGES } from "./renderer-packages.js";

/**
 * Everything that would stop a project building, found before the bundler runs: a view whose
 * renderer this version cannot build, a renderer package the project has not installed, and a
 * framework view with a `.client.ts`, whose browser behaviour is its component already.
 */
export function buildProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly string[] {
  const problems: string[] = [];
  for (const assembly of assemblies) {
    if (assembly.renderer === "html") continue;
    const known = Object.hasOwn(RENDERER_PACKAGES, assembly.renderer)
      ? RENDERER_PACKAGES[assembly.renderer]
      : undefined;
    if (known === undefined) {
      problems.push(
        `"${assembly.name}" is a ${assembly.renderer} assembly, which this version cannot build yet`,
      );
      continue;
    }
    if (findPackage(root, known.package) === undefined) {
      problems.push(`"${assembly.name}" is a ${known.name} assembly; install ${known.package}`);
    }
    if (assembly.client !== undefined) {
      problems.push(
        `"${assembly.name}" has a .client.ts, but a ${known.name} view's browser behaviour is its component`,
      );
    }
  }
  return problems;
}
