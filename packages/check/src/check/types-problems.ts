// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import type { DiscoveredAssembly, ProjectProblem } from "@assemblejs/build";
import { findPackage } from "@assemblejs/build";

// The packages a React view is checked against. React ships no types of its own.
const REACT_TYPES = ["@types/react", "@types/react-dom"] as const;

/**
 * What a project with a React view lacks to type-check: React's types, installed as development
 * dependencies, which the TypeScript setup the build writes reads for every React view and the
 * render calls generated on it. Named by the checks only: the build compiles a React view with
 * no types at all, and refusing to build for want of them would stop a project that runs.
 */
export function typesProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  if (!assemblies.some((assembly) => assembly.renderer === "react")) return [];
  return REACT_TYPES.filter((name) => findPackage(root, name) === undefined).map((name) => ({
    path: join(root, "package.json"),
    rule: "a-react-view-needs-its-types",
    message: `this project has React assemblies and ${name} is not installed`,
    fix: `install ${name} as a development dependency`,
  }));
}
