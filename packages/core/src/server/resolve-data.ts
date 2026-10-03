// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyView } from "../assembly/assembly-view.js";
import type { JsonObject } from "../json/json-object.js";
import { runServices } from "../service/run-services.js";
import type { ServiceContext } from "../service/service-context.js";
import { viewSchema } from "./view-schema.js";

/**
 * The data an assembly renders with, and the same object its data endpoint answers.
 *
 * ONE function, called by both endpoints. That is not an implementation detail: it is the reason
 * the contract can promise the two never drift, and it stays true now that a view may declare
 * services as well as a data function, because both forms are resolved here and nowhere else.
 *
 * Services first, then the view's own data on top: the inline form is the more specific of the
 * two, so it wins, the same way a later service wins over an earlier one. Where they declare
 * schemas, no two of them may claim the same field, which boot has already checked; what is
 * checked here is that every field the composed schema requires came back.
 */
export async function resolveData(
  view: AssemblyView,
  context: ServiceContext,
): Promise<JsonObject> {
  const fromServices = await runServices(view.services ?? [], context);
  const own = view.data === undefined ? {} : await view.data({ query: context.query });
  const data = { ...fromServices, ...own };
  for (const field of viewSchema(view).schema.required ?? []) {
    if (!Object.hasOwn(data, field)) {
      throw new Error(`data field "${field}" is required and nothing returned it`);
    }
  }
  return data;
}
