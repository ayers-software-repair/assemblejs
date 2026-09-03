// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyView } from "../assembly/assembly-view.js";
import type { JsonObject } from "../json/json-object.js";
import { runServices } from "../service/run-services.js";
import type { ServiceContext } from "../service/service-context.js";

/**
 * The data an assembly renders with, and the same object its data endpoint answers.
 *
 * ONE function, called by both endpoints. That is not an implementation detail: it is the reason
 * the contract can promise the two never drift, and it stays true now that a view may declare
 * services as well as a data function, because both forms are resolved here and nowhere else.
 *
 * Services first, then the view's own data on top: the inline form is the more specific of the
 * two, so it wins, the same way a later service wins over an earlier one.
 */
export async function resolveData(
  view: AssemblyView,
  context: ServiceContext,
): Promise<JsonObject> {
  const fromServices = await runServices(view.services ?? [], context);
  const own = view.data === undefined ? {} : await view.data({ query: context.query });
  return { ...fromServices, ...own };
}
