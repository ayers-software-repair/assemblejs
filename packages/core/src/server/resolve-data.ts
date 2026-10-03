// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyView } from "../assembly/assembly-view.js";
import type { JsonObject } from "../json/json-object.js";
import { runServices } from "../service/run-services.js";
import type { ServiceContext } from "../service/service-context.js";
import { OWN_DATA_SOURCE } from "./own-data-source.js";
import { serviceSource } from "./service-source.js";
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
 * schemas, no two of them may claim the same field, which boot has already checked. What is
 * checked here is what boot cannot see: that no contributor returned a field another one
 * declared, which would overwrite it whatever the declaring author asked for, and that every
 * field the composed schema requires came back.
 */
export async function resolveData(
  view: AssemblyView,
  context: ServiceContext,
): Promise<JsonObject> {
  const { schema, owners } = viewSchema(view);
  const claimed = (source: string, returned: JsonObject): void => {
    for (const field of Object.keys(returned)) {
      const owner = owners.get(field);
      if (owner !== undefined && owner !== source) {
        throw new Error(`${source} returned data field "${field}", which ${owner} declares`);
      }
    }
  };
  const fromServices = await runServices(view.services ?? [], context, (service, returned) =>
    claimed(serviceSource(service.name), returned),
  );
  const own = view.data === undefined ? {} : await view.data({ query: context.query });
  claimed(OWN_DATA_SOURCE, own);
  const data = { ...fromServices, ...own };
  for (const field of schema.required ?? []) {
    if (!Object.hasOwn(data, field)) {
      throw new Error(`data field "${field}" is required and nothing returned it`);
    }
  }
  return data;
}
