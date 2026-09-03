// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { ServiceContext } from "./service-context.js";

/**
 * A server-side step that produces an assembly's data.
 *
 * It RETURNS its data and does not mutate a shared context. Mutation makes every service
 * order-dependent, untestable on its own, and silent about what it actually contributed: with a
 * return, the data's shape is the function's return type and a service can be called in a test
 * with nothing around it.
 *
 * `after` names the services this one must follow. There is no priority number, because a
 * number is a claim about every other service in the system made by someone who can only see
 * one of them.
 */
export interface ServiceDefinition<D extends JsonObject = JsonObject> {
  readonly name: string;
  readonly after?: readonly string[];
  run(context: ServiceContext): D | Promise<D>;
}
