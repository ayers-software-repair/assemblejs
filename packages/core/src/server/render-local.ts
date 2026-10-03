// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { renderEnvelope } from "../envelope/render-envelope.js";
import { resolveData } from "./resolve-data.js";

/**
 * One assembly, rendered in this process, wrapped in its envelope.
 *
 * The content endpoint and the composer's local transport both call this, so an assembly placed
 * on a page renders exactly what its own endpoint answers. A local assembly that took a shorter
 * path than the endpoint would be the special case the contract exists to rule out.
 */
export async function renderLocal(
  assembly: AssemblyDefinition,
  view: string,
  id: string,
  query: URLSearchParams,
): Promise<string> {
  const declared = assembly.views[view];
  if (declared === undefined) {
    throw new Error(`assembly "${assembly.name}" has no view "${view}"`);
  }
  const data = await resolveData(declared, { query, params: {} });
  const markup = await declared.markup({ data, children: {}, id });
  return renderEnvelope({
    id,
    name: assembly.name,
    view,
    renderer: declared.renderer,
    markup,
    data,
    ...(assembly.mount === undefined ? {} : { mount: assembly.mount }),
    ...(assembly.shadow === true ? { shadow: { css: assembly.assets?.css ?? [] } } : {}),
  });
}
