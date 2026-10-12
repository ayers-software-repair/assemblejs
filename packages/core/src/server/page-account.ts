// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { AssemblyPlan } from "../compose/assembly-plan.js";
import type { Diagnostic } from "../compose/diagnostic.js";
import type { OutlineAccount } from "../outline/outline-account.js";
import type { OutlinePlacement } from "../outline/outline-placement.js";
import { placedAssemblyOf } from "./placed-assembly-of.js";

/**
 * The account of how a page was composed that the page's outline is told: for each placement,
 * which assembly, which rung of the ladder answered and how long the server waited for it.
 *
 * Built by naming every field that goes in, as the data island is, and never by copying the
 * composer's account: that one holds what a failure threw and the id it was logged against,
 * which are the log's, and this one is sent to whoever asked for the page. So the reason a
 * placement fell back is not here either. A visitor is shown that it did.
 */
export function pageAccount(
  page: { readonly route: string; readonly ms: number },
  diagnostics: readonly Diagnostic[],
  plan: Readonly<Record<string, AssemblyPlan>>,
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
): OutlineAccount {
  const row = (diagnostic: Diagnostic, placedByPage: boolean): OutlinePlacement => {
    // Whether it mounts is known of this server's assemblies alone, and a fallback never does.
    const elsewhere =
      placedByPage &&
      Object.hasOwn(plan, diagnostic.name) &&
      plan[diagnostic.name]?.url !== undefined;
    const assembly =
      elsewhere || diagnostic.source === "fallback" ? undefined : assemblies.get(diagnostic.name);
    return {
      id: diagnostic.id,
      name: diagnostic.name,
      view: diagnostic.view,
      source: diagnostic.source,
      ms: Math.round(diagnostic.ms * 10) / 10,
      ...(assembly === undefined ? {} : { browser: placedAssemblyOf(assembly).browserHalf }),
      ...(diagnostic.refused === undefined ? {} : { refused: diagnostic.refused }),
      ...(diagnostic.children === undefined
        ? {}
        : { children: diagnostic.children.map((child) => row(child, false)) }),
    };
  };
  return {
    route: page.route,
    ms: Math.round(page.ms * 10) / 10,
    placements: diagnostics.map((diagnostic) => row(diagnostic, true)),
  };
}
