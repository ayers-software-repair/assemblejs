// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { ReturnedObject } from "../json/returned-object.js";
import { withoutAbsentMembers } from "../json/without-absent-members.js";
import { NotFound } from "./not-found.js";
import { orderServices } from "./order-services.js";
import type { ServiceContext } from "./service-context.js";
import type { ServiceDefinition } from "./service-definition.js";

/**
 * Runs an assembly's services in order and merges what each returned.
 *
 * Sequential on purpose: a service that declared `after` said it needs the one before it to have
 * finished, and running them concurrently would make that declaration a lie. Services that do
 * not depend on each other are still cheap; a service that is slow enough to matter is a service
 * that wanted an api endpoint.
 *
 * A later service's key wins over an earlier one's, which is the same rule as the order itself:
 * what runs last has seen the most. `inspect` sees each service's own return before it is
 * merged, which is the one point where who returned a field is still known. A member a service
 * left out, or returned as `undefined`, is not a field it returned.
 *
 * A `NotFound` goes on naming the service that threw it, for the line the page logs.
 */
export async function runServices<D extends ReturnedObject>(
  services: readonly ServiceDefinition<D>[],
  context: ServiceContext,
  inspect?: (service: ServiceDefinition<D>, returned: JsonObject) => void,
): Promise<JsonObject> {
  let data: JsonObject = {};
  for (const service of orderServices(services)) {
    let returned: JsonObject;
    try {
      returned = withoutAbsentMembers(await service.run(context));
    } catch (error) {
      if (!(error instanceof NotFound)) throw error;
      const said = error.message === "" ? "" : `: ${error.message}`;
      throw new NotFound(`service "${service.name}" said not found${said}`);
    }
    inspect?.(service, returned);
    data = { ...data, ...returned };
  }
  return data;
}
