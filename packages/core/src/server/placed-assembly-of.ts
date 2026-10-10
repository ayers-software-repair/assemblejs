// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { PlacedAssembly } from "./placed-assembly.js";

/**
 * What the placement rules read of a declared assembly: the views it answers under, whether it
 * has a browser half that mounts, and what each view's source is known to place.
 */
export function placedAssemblyOf(assembly: AssemblyDefinition): PlacedAssembly {
  const placements = Object.fromEntries(
    Object.entries(assembly.views).flatMap(([view, declared]) =>
      declared.placements === undefined ? [] : [[view, declared.placements] as const],
    ),
  );
  return {
    views: Object.keys(assembly.views),
    browserHalf: assembly.mount !== "none" && (assembly.assets?.js.length ?? 0) > 0,
    ...(Object.keys(placements).length === 0 ? {} : { placements }),
  };
}
