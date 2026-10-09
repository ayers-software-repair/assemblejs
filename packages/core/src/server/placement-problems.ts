// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Placement } from "../compose/placement.js";
import type { PagePlacement } from "../page/page-placement.js";
import { isRemotePolicy } from "./is-remote-policy.js";
import { opensRuntime } from "./opens-runtime.js";
import type { PlacedAssembly } from "./placed-assembly.js";
import type { PlacementProblem } from "./placement-problem.js";

/**
 * Everything wrong with how one page places assemblies, found without running anything: a
 * local placement naming an assembly, or a view of it, that does not exist, and policy that
 * nothing would read or the server could not act on. A placement from another server is held
 * here only for what its presence means; what its url names is checked by whoever can read it,
 * boot from the plan and `check` from the file. Boot calls this with what the registry built and
 * `check` with what it read from the files, so both refuse the same page the same way.
 */
export function placementProblems(
  at: string,
  placements: readonly Placement[],
  place: Readonly<Record<string, unknown>>,
  assemblies: ReadonlyMap<string, PlacedAssembly>,
): readonly PlacementProblem[] {
  const problems: PlacementProblem[] = [];
  const found = (name: string, about: PlacementProblem["about"], message: string): void => {
    problems.push({ name, about, message: `${at} ${message}` });
  };
  for (const { name, view } of placements) {
    if (isRemotePolicy(place, name)) continue;
    const assembly = assemblies.get(name);
    if (assembly === undefined) {
      found(name, "assembly", `places "${name}", and there is no such assembly`);
    } else if (!assembly.views.includes(view)) {
      found(name, "view", `places "${name}" with a view "${view}" it does not have`);
    }
  }

  const opened = opensRuntime(placements, place, assemblies);
  const placed = new Set(placements.map((placement) => placement.name));
  for (const [name, policy] of Object.entries(place)) {
    const wrong = (message: string): void => found(name, "policy", message);
    if (typeof policy !== "object" || policy === null) {
      wrong(`declares policy for "${name}" that is not an object`);
      continue;
    }
    if (!placed.has(name)) wrong(`declares policy for "${name}", which its template never places`);
    const declared = policy as PagePlacement;
    if (declared.defer === true && declared.required === true) {
      wrong(`declares "${name}" both deferred and required`);
    }
    // The browser fills a deferred placement from the page's own origin, with this server's
    // runtime: another server's fragment is refused by its same-origin policy, and a page with
    // no assembly of this server's that runs in the browser has no runtime to fetch it. Its
    // deadline and cache would be read by nothing, as the browser fetches it after load.
    if (declared.defer === true && declared.url !== undefined) {
      wrong(
        `defers "${name}" from another server, which the browser could not fetch across origins`,
      );
    }
    if (declared.defer === true && declared.url === undefined && !opened) {
      wrong(
        `defers "${name}" and places no assembly of this server's with a browser half, so nothing would fill it`,
      );
    }
    if (
      declared.defer === true &&
      (declared.deadline !== undefined || declared.cache !== undefined)
    ) {
      wrong(
        `gives deferred "${name}" a deadline or a cache, which nothing reads: the browser fetches it after load`,
      );
    }
    if (
      declared.deadline !== undefined &&
      !(Number.isFinite(declared.deadline) && declared.deadline > 0)
    ) {
      wrong(`gives "${name}" a deadline that is not a positive, finite number`);
    }
  }
  return problems;
}
