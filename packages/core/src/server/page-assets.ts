// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { AssemblyPlan } from "../compose/assembly-plan.js";
import type { ComposeResult } from "../compose/compose-result.js";
import type { RemoteTransport } from "../remote/remote-transport.js";
import { localAssets } from "./local-assets.js";

/**
 * The browser files a composed page links: the stylesheets and modules of every assembly on it.
 *
 * This server's are read from the envelopes in the page's own markup, so a child a view placed
 * is linked as its parent is, and so is one inside an answer that came from the cache. A
 * placement the page's plan sends to another server links what that server's manifest declared.
 * This server's come first, in the order they stand on the page.
 */
export async function pageAssets(
  composed: ComposeResult,
  plan: Readonly<Record<string, AssemblyPlan>>,
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
  remote: RemoteTransport,
): Promise<AssemblyAssets> {
  const local = localAssets(composed.html, assemblies);
  const css = [...local.css];
  const js = [...local.js];
  for (const diagnostic of composed.diagnostics) {
    const url = Object.hasOwn(plan, diagnostic.name) ? plan[diagnostic.name]?.url : undefined;
    if (url === undefined) continue;
    const declared = await remote.assets(url);
    css.push(...(declared?.css ?? []));
    js.push(...(declared?.js ?? []));
  }
  return { css, js };
}
