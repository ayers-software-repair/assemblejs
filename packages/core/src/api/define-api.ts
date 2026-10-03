// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "./api-definition.js";

/**
 * Identity, for inference and for a name at the point of declaration. It answers the definition's
 * own type, so a data api stays one with a `handle` and a stream one with a `stream`.
 */
export function defineApi<Api extends ApiDefinition>(definition: Api): Api {
  return definition;
}
