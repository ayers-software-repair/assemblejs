// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { IncomingHttpHeaders } from "node:http";

/**
 * A request's headers as plain text: names lower-cased and a header sent twice joined, both as
 * Node gives them. The result has no prototype, so a header named `constructor` is a header
 * and nothing else. Every api reads headers through here.
 */
export function headersOf(headers: IncomingHttpHeaders): Readonly<Record<string, string>> {
  const text: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) text[name] = Array.isArray(value) ? value.join(", ") : value;
  }
  return text;
}
