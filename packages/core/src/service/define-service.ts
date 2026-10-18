// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ReturnedObject } from "../json/returned-object.js";
import type { ServiceDefinition } from "./service-definition.js";

/** Identity, for inference and for a name at the point of declaration. */
export function defineService<D extends ReturnedObject>(
  definition: ServiceDefinition<D>,
): ServiceDefinition<D> {
  return definition;
}
