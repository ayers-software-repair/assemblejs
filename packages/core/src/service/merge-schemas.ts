// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { DataSchema } from "./data-schema.js";

/**
 * Deep-merges the schemas of everything that contributes to one view's data: properties are
 * unioned and required lists concatenated.
 *
 * A field declared by two contributors is a problem, not an overwrite. Which one wins would
 * otherwise depend on the order the merge ran in, and the author of each can see only their own
 * half. A required field that no contributor declares is a problem too, because nothing would
 * ever satisfy it.
 */
export function mergeSchemas(
  parts: ReadonlyArray<{ readonly source: string; readonly schema: DataSchema }>,
): { readonly schema: DataSchema; readonly problems: readonly string[] } {
  const properties: Record<string, JsonObject> = {};
  const owner = new Map<string, string>();
  const required: string[] = [];
  const problems: string[] = [];

  for (const { source, schema } of parts) {
    for (const [field, definition] of Object.entries(schema.properties)) {
      const first = owner.get(field);
      if (first !== undefined) {
        problems.push(`data field "${field}" is declared by both ${first} and ${source}`);
        continue;
      }
      owner.set(field, source);
      properties[field] = definition;
    }
    for (const field of schema.required ?? []) {
      if (!Object.hasOwn(schema.properties, field)) {
        problems.push(`${source} requires data field "${field}" but does not declare it`);
      }
      if (!required.includes(field)) required.push(field);
    }
  }
  return { schema: { properties, required }, problems };
}
