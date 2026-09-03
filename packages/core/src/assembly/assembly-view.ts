// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { ServiceDefinition } from "../service/service-definition.js";
import type { DataInput } from "./data-input.js";
import type { MarkupInput } from "./markup-input.js";

/**
 * One view of one assembly.
 *
 * `data` is called by BOTH the content endpoint and the data endpoint. That is not an
 * implementation detail: it is the reason the two can never drift, and it is why the contract
 * can promise that the data endpoint answers exactly what the island carries.
 */
export interface AssemblyView {
  readonly renderer: string;
  /** Services that run before this view renders. Their returns are merged, in order. */
  readonly services?: readonly ServiceDefinition[];
  /** The view's own data, merged over what the services returned. Optional if services suffice. */
  data?(input: DataInput): JsonObject | Promise<JsonObject>;
  markup(input: MarkupInput): string | Promise<string>;
}
