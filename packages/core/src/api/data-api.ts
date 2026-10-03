// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from "../json/json-value.js";
import type { ApiContext } from "./api-context.js";

/** A route that answers each request with data: one method, named by `method`, answered by `handle`. */
export interface DataApi {
  readonly path: string;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  handle(context: ApiContext): JsonValue | Promise<JsonValue>;
  /** A data api does not stream: a definition with both a handler and a stream is refused. */
  readonly stream?: never;
}
