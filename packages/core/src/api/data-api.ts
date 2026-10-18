// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ReturnedValue } from "../json/returned-value.js";
import type { ApiContext } from "./api-context.js";
import type { ApiReply } from "./api-reply.js";

/**
 * A route that answers each request with data: one method, named by `method`, answered by
 * `handle`. A plain value is the JSON reply; `reply(...)` adds a status, headers, cookies or a
 * redirect.
 */
export interface DataApi {
  readonly path: string;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  handle(context: ApiContext): ReturnedValue | ApiReply | Promise<ReturnedValue | ApiReply>;
  /** A data api does not stream: a definition with both a handler and a stream is refused. */
  readonly stream?: never;
}
