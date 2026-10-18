// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from "../json/json-value.js";

/** What an api handler is given. */
export interface ApiContext {
  readonly query: URLSearchParams;
  readonly params: Readonly<Record<string, string>>;
  /** The parsed request body. Absent for a request that carried none, which every GET is. */
  readonly body: JsonValue | undefined;
  /** The request's headers, names lower-cased, a header sent twice joined as Node gives it. */
  readonly headers: Readonly<Record<string, string>>;
  /** The request's cookies, parsed and percent-decoded. */
  readonly cookies: Readonly<Record<string, string>>;
}
