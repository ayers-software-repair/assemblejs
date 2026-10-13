// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename, isAbsolute, relative, sep } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { jsxOwner } from "../discovery/jsx-owner.js";

/**
 * What compiles a `.tsx` or `.jsx` file, when the file itself decides: the package whose JSX
 * runtime it uses, or `solid`. A file that names its framework (`cart.preact.tsx`) says so; one
 * that does not takes the framework of the assembly whose directory holds it, so a Preact view's
 * own components compile as Preact. Undefined for a file neither decides, whose importers do.
 * The written TypeScript setup puts each file in the project of the same owner, so the compiler
 * and the checker read every file as one framework's.
 */
export function jsxSource(
  file: string,
  assemblies: readonly DiscoveredAssembly[],
): string | undefined {
  const infix = /\.([a-z]+)\.[jt]sx$/.exec(basename(file))?.[1];
  const named = infix === undefined ? undefined : jsxOwner(infix);
  if (named !== undefined) return named;
  const owner = assemblies.find((assembly) => {
    const step = relative(assembly.directory, file);
    return step !== "" && step !== ".." && !step.startsWith(`..${sep}`) && !isAbsolute(step);
  });
  return owner === undefined ? undefined : jsxOwner(owner.renderer);
}
