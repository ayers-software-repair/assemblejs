// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import { discoverAssemblies, isStaticView, leadsOut, readInside, viewModules } from "@asmjs/build";
import type { ProjectRoot } from "../root/project-root.js";

/** The current placement inputs, for detecting edits across asynchronous validation. */
export function placementSources(root: ProjectRoot): string {
  return JSON.stringify(
    discoverAssemblies(root.path).assemblies.map((assembly) => {
      const file = isAbsolute(assembly.view) ? assembly.view : join(root.path, assembly.view);
      const modules = leadsOut(root.path, file)
        ? []
        : isStaticView(assembly.renderer)
          ? [file]
          : viewModules(root.path, file).modules;
      return [
        assembly.name,
        assembly.view,
        assembly.renderer,
        modules.map((module) => [module, readInside(root.path, module)]),
      ];
    }),
  );
}
