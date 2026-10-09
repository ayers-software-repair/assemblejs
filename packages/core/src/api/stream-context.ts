// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { StreamMessage } from "../island/stream-message.js";
import type { JsonValue } from "../json/json-value.js";

/** What a streaming api is given for one connection. */
export interface StreamContext {
  readonly query: URLSearchParams;
  readonly params: Readonly<Record<string, string>>;
  /**
   * Sends one message to this connection's page, where the runtime puts it on the page's bus for
   * every assembly, or for those named by `to`. Nothing is sent once the connection has closed.
   */
  send(topic: string, payload: JsonValue, to?: StreamMessage["to"]): void;
  /** Aborted when the connection closes, from either end: where a stream stops what it started. */
  readonly signal: AbortSignal;
}
