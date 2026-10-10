// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "@assemblejs/core";
import { readInside } from "../root/read-inside.js";
import type { LiteralValue } from "./literal-value.js";
import { readDefaultExport } from "./read-default-export.js";

/**
 * An api file's route as the server reads it, from its source and never run: its path, its
 * method, and whether it streams, shaped as the definition core's own rules take, so `check`
 * refuses a route by the same function boot does. Undefined for a path or a method the file
 * computes, which only running the project could tell. A file that leads out of the project
 * throws, unopened.
 */
export function readApi(root: string, file: string): ApiDefinition | undefined {
  const declared: LiteralValue = readDefaultExport(readInside(root, file));
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) {
    return undefined;
  }
  const fields = declared as Readonly<Record<string, LiteralValue>>;
  const path = fields["path"];
  const method = "method" in fields ? fields["method"] : "GET";
  if (typeof path !== "string" || typeof method !== "string") return undefined;
  // Only the route is read; what answers it is the running server's.
  return "stream" in fields
    ? ({ path, method, stream: () => undefined } as ApiDefinition)
    : ({ path, method, handle: () => null } as ApiDefinition);
}
