// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { AssemblyPlan } from "../compose/assembly-plan.js";
import type { ComposeResult } from "../compose/compose-result.js";
import type { RemoteTransport } from "../remote/remote-transport.js";

/**
 * The browser files a composed page links: for each placement, the stylesheets and modules of
 * the assembly that was placed. A placement from another server links what that server's
 * manifest declared; one of this server's links what its definition declares.
 *
 * A shadow assembly's styles are linked inside its shadow root, never in the page, so its
 * stylesheets are left out here; its modules are not.
 */
export async function pageAssets(
  composed: ComposeResult,
  plan: Readonly<Record<string, AssemblyPlan>>,
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
  remote: RemoteTransport,
): Promise<AssemblyAssets> {
  const css: string[] = [];
  const js: string[] = [];
  for (const diagnostic of composed.diagnostics) {
    const url = Object.hasOwn(plan, diagnostic.name) ? plan[diagnostic.name]?.url : undefined;
    const declared =
      url === undefined ? assemblies.get(diagnostic.name)?.assets : await remote.assets(url);
    const shadow = url === undefined && assemblies.get(diagnostic.name)?.shadow === true;
    if (!shadow) css.push(...(declared?.css ?? []));
    js.push(...(declared?.js ?? []));
  }
  return { css, js };
}
