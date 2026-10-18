// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ReturnedValue } from "../json/returned-value.js";
import type { CookieOptions } from "./cookie-options.js";

/** What an api answers when a plain value is not enough. Made by `reply`, never written by hand. */
export interface ApiReply {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  /** Each cookie by name; each is sent as a header of its own. */
  readonly cookies: Readonly<Record<string, CookieOptions>>;
  /** Sent as JSON. Absent, the answer has no body. */
  readonly body?: ReturnedValue;
}
