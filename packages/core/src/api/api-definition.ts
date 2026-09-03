// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from "../json/json-value.js";
import type { ApiContext } from "./api-context.js";

/**
 * A route that serves data to anyone.
 *
 * One method per definition, named as the field. A definition that answered several methods
 * would need a router inside it, and the router already exists one level up.
 */
export interface ApiDefinition {
  readonly path: string;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  handle(context: ApiContext): JsonValue | Promise<JsonValue>;
}
