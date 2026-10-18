// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "./json-object.js";
import type { JsonValue } from "./json-value.js";
import type { ReturnedObject } from "./returned-object.js";
import type { ReturnedValue } from "./returned-value.js";

/**
 * What a returned object is once JSON has dropped its absent members, at every depth: the same
 * object a browser would be sent, so a renderer on the server sees what the browser sees.
 */
export function withoutAbsentMembers(returned: ReturnedObject): JsonObject {
  const clean = (value: ReturnedValue): JsonValue => {
    if (Array.isArray(value)) return value.map(clean);
    if (value !== null && typeof value === "object") return withoutAbsentMembers(value);
    return value;
  };
  return Object.fromEntries(
    Object.entries(returned).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, clean(value)]],
    ),
  );
}
