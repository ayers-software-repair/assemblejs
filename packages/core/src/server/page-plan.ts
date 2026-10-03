// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyPlan } from "../compose/assembly-plan.js";
import { DEFAULT_DEADLINE } from "../compose/default-deadline.js";
import { findPlacements } from "../compose/find-placements.js";
import type { PageDefinition } from "../page/page-definition.js";

/**
 * The composer's plan for a page: one entry per placement the page declared policy for, with
 * the composer's own default deadline where the page named none. A placement with no entry is
 * local and needs none.
 */
export function pagePlan(page: PageDefinition): Readonly<Record<string, AssemblyPlan>> {
  const plan: Record<string, AssemblyPlan> = {};
  const views = new Map(
    findPlacements(page.template).map((placement) => [placement.name, placement.view]),
  );
  for (const [name, placement] of Object.entries(page.place ?? {})) {
    plan[name] = {
      name,
      view: views.get(name) ?? "default",
      deadline: placement.deadline ?? DEFAULT_DEADLINE,
      ...(placement.url === undefined ? {} : { url: placement.url }),
      ...(placement.fallback === undefined ? {} : { fallback: placement.fallback }),
      ...(placement.required === undefined ? {} : { required: placement.required }),
      ...(placement.defer === undefined ? {} : { defer: placement.defer }),
      ...(placement.cache === undefined ? {} : { cache: placement.cache }),
    };
  }
  return plan;
}
