// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/**
 * Everything that crosses from the server to the browser, and nothing else.
 *
 * Six fields, named. Not the request, not headers, not cookies, and never the rendered bytes of
 * child assemblies, which are already in the DOM. Because the projection names each field, a
 * new field on the server's own context can never appear here by growing into it.
 */
export interface IslandPayload {
  readonly id: string;
  readonly name: string;
  readonly view: string;
  readonly renderer: string;
  readonly data: JsonObject;
  readonly deferred: boolean;
}
