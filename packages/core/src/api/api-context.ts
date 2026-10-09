// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from "../json/json-value.js";

/** What an api handler is given. */
export interface ApiContext {
  readonly query: URLSearchParams;
  readonly params: Readonly<Record<string, string>>;
  /** The parsed request body. Absent for a request that carried none, which every GET is. */
  readonly body: JsonValue | undefined;
}
