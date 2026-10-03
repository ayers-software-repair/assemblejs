// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename, isAbsolute, relative, sep } from "node:path";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";

// The frameworks whose views are JSX, by what compiles them: the package holding an automatic
// runtime, or `solid`, whose JSX only Solid's own compiler reads.
const RUNTIMES: Readonly<Record<string, string>> = {
  react: "react",
  preact: "preact",
  solid: "solid",
};

/**
 * What compiles a `.tsx` or `.jsx` file: the package whose JSX runtime it uses, or `solid`. A file
 * that names its framework (`cart.preact.tsx`) says so itself; one that does not takes the framework of the assembly whose
 * directory holds it, so a Preact view's own components compile as Preact; anything else is React.
 */
export function jsxSource(file: string, assemblies: readonly DiscoveredAssembly[]): string {
  const infix = /\.([a-z]+)\.[jt]sx$/.exec(basename(file))?.[1];
  if (infix !== undefined && Object.hasOwn(RUNTIMES, infix)) return RUNTIMES[infix] ?? "react";
  const owner = assemblies.find((assembly) => {
    const step = relative(assembly.directory, file);
    return step !== "" && step !== ".." && !step.startsWith(`..${sep}`) && !isAbsolute(step);
  });
  const framework = owner?.renderer ?? "react";
  return Object.hasOwn(RUNTIMES, framework) ? (RUNTIMES[framework] ?? "react") : "react";
}
