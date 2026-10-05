// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Placement } from "../compose/placement.js";
import { isRemotePolicy } from "./is-remote-policy.js";
import type { PlacedAssembly } from "./placed-assembly.js";

/**
 * Whether a page's own runtime is on the page: it is linked only for an assembly of this
 * server's that has a browser half, so a page of static views, or of another server's
 * assemblies alone, has nothing to open its stream or fill a deferred placement.
 */
export function opensRuntime(
  placements: readonly Placement[],
  place: Readonly<Record<string, unknown>>,
  assemblies: ReadonlyMap<string, PlacedAssembly>,
): boolean {
  return placements.some(
    (placement) =>
      !isRemotePolicy(place, placement.name) &&
      assemblies.get(placement.name)?.browserHalf === true,
  );
}
