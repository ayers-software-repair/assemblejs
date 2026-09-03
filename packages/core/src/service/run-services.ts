// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
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
 * what runs last has seen the most.
 */
export async function runServices<D extends JsonObject>(
  services: readonly ServiceDefinition<D>[],
  context: ServiceContext,
): Promise<JsonObject> {
  let data: JsonObject = {};
  for (const service of orderServices(services)) {
    data = { ...data, ...(await service.run(context)) };
  }
  return data;
}
