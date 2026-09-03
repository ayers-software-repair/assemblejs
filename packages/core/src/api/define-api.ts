// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "./api-definition.js";

/** Identity, for inference and for a name at the point of declaration. */
export function defineApi(definition: ApiDefinition): ApiDefinition {
  return definition;
}
