// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { DataSchema } from "../service/data-schema.js";
import type { ServiceDefinition } from "../service/service-definition.js";
import type { DataInput } from "./data-input.js";
import type { MarkupInput } from "./markup-input.js";
import type { ViewPlacement } from "./view-placement.js";

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
  /** The fields the view's own data adds, merged with its services' schemas. */
  readonly schema?: DataSchema;
  markup(input: MarkupInput): string | Promise<string>;
  /**
   * What this view's source is known to place, written by whoever read the source: the build,
   * for a project. Boot holds each to the rules a page's placements are held to, and reads them
   * for what a page needs before the view has rendered: whether it carries the runtime, and
   * what a deferred placement's children need linked. Absent where nothing read the source.
   */
  readonly placements?: readonly ViewPlacement[];
}
