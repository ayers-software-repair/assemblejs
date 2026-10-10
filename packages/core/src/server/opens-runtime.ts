// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Placement } from "../compose/placement.js";
import { isRemotePolicy } from "./is-remote-policy.js";
import type { PlacedAssembly } from "./placed-assembly.js";
import { placedBeneath } from "./placed-beneath.js";

/**
 * Whether a page's own runtime is on the page: it is linked only for an assembly of this
 * server's that has a browser half, placed by the page or by the view of one it places, at any
 * depth its sources tell. So a page of static views, or of another server's assemblies alone,
 * has nothing to open its stream or fill a deferred placement.
 */
export function opensRuntime(
  placements: readonly Placement[],
  place: Readonly<Record<string, unknown>>,
  assemblies: ReadonlyMap<string, PlacedAssembly>,
): boolean {
  const assemblyOf = (name: string): PlacedAssembly | undefined => assemblies.get(name);
  return placements.some((placement) => {
    if (isRemotePolicy(place, placement.name)) return false;
    let opened = assemblyOf(placement.name)?.browserHalf === true;
    placedBeneath(
      placement,
      assemblyOf,
      (placed) => {
        opened ||= assemblyOf(placed.name)?.browserHalf === true;
      },
      undefined,
    );
    return opened;
  });
}
