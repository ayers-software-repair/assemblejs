// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { StreamContext } from "./stream-context.js";

/**
 * A route that holds its response open and streams server-sent events to a page, which its
 * runtime delivers onto the page's bus. `stream` runs once per connection; what it starts it
 * stops when the context's signal aborts. A stream answers GET, which is all a browser's event
 * source asks.
 */
export interface StreamApi {
  readonly path: string;
  readonly method?: "GET";
  stream(context: StreamContext): void | Promise<void>;
}
