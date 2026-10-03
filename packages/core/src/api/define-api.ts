// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "./api-definition.js";

/**
 * Identity, for inference and for a name at the point of declaration. Typed as the definition
 * itself, so a property the definition does not have (a misspelt `method`) is a type error rather
 * than a route mounted as GET, and one with both `handle` and `stream` is refused.
 */
export function defineApi(definition: ApiDefinition): ApiDefinition {
  return definition;
}
