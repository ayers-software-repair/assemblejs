// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyView } from "../assembly/assembly-view.js";
import type { DataSchema } from "../service/data-schema.js";
import { mergeSchemas } from "../service/merge-schemas.js";

/**
 * The composed schema of one view: each of its services' schemas, then the view's own, merged.
 * A contributor that declares no schema contributes no fields to it.
 */
export function viewSchema(view: AssemblyView): {
  readonly schema: DataSchema;
  readonly problems: readonly string[];
} {
  const parts: Array<{ source: string; schema: DataSchema }> = [];
  for (const service of view.services ?? []) {
    if (service.schema !== undefined) {
      parts.push({ source: `service "${service.name}"`, schema: service.schema });
    }
  }
  if (view.schema !== undefined) parts.push({ source: "the view's own data", schema: view.schema });
  return mergeSchemas(parts);
}
