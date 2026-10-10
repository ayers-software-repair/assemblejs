// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { compose } from "../compose/compose.js";
import { identity } from "../compose/identity.js";
import { renderEnvelope } from "../envelope/render-envelope.js";
import { localAssets } from "./local-assets.js";
import type { LocalRenderInput } from "./local-render-input.js";
import type { LocalRendered } from "./local-rendered.js";
import { resolveData } from "./resolve-data.js";

/**
 * One assembly, rendered in this process, wrapped in its envelope, with every child its view
 * placed composed inside it.
 *
 * The content endpoint and the composer's local transport both call this, so an assembly placed
 * on a page renders exactly what its own endpoint answers. A local assembly that took a shorter
 * path than the endpoint would be the special case the contract exists to rule out.
 *
 * A view places a child as a page does, with the directive in its markup. The view renders
 * once; the composer then reads what it rendered and puts each child's envelope where its
 * directive stood. The children are dispatched one level deeper than this assembly arrived,
 * with this assembly added to the ancestors, so a child that is its own ancestor and a chain
 * past the cap are both refused before anything is dispatched. A child has no policy of its own:
 * it is this server's, it gets the default deadline, and one that fails leaves its failed
 * envelope inside a parent that still answered.
 */
export async function renderLocal(
  assembly: AssemblyDefinition,
  view: string,
  input: LocalRenderInput,
): Promise<LocalRendered> {
  const declared = assembly.views[view];
  if (declared === undefined) {
    throw new Error(`assembly "${assembly.name}" has no view "${view}"`);
  }
  const data = await resolveData(declared, { query: input.query, params: input.params });
  const markup = await declared.markup({ data, children: {}, id: input.id });
  const composed = await compose({
    template: markup,
    plan: {},
    fetch: input.fetch,
    limits: input.limits,
    page: input.page,
    depth: input.depth,
    path: [...input.path, identity(assembly.name, view)],
    query: input.query,
    params: input.params,
    ...(input.signal === undefined ? {} : { signal: input.signal }),
    newId: input.newId,
    now: input.now,
  });
  // A shadow root is the only place a stylesheet reaches what is inside it, so it links its own
  // assembly's and those of every child placed there, each once.
  const rootStyles = [
    ...new Set([
      ...(assembly.assets?.css ?? []),
      ...localAssets(composed.html, input.assemblies).css,
    ]),
  ];
  const html = renderEnvelope({
    id: input.id,
    name: assembly.name,
    view,
    renderer: declared.renderer,
    markup: composed.html,
    data,
    ...(assembly.mount === undefined ? {} : { mount: assembly.mount }),
    ...(assembly.shadow === true ? { shadow: { css: rootStyles } } : {}),
  });
  return { html, diagnostics: composed.diagnostics };
}
