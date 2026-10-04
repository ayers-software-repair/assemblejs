// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import type { LiteralValue } from "./literal-value.js";
import { readDefaultExport } from "./read-default-export.js";

/**
 * The path an api file answers GET at, read from its source, never run: undefined for an api of
 * another method, and for a path or a method the file computes.
 */
export function apiRoute(file: string): string | undefined {
  const declared: LiteralValue = readDefaultExport(readFileSync(file, "utf8"));
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) {
    return undefined;
  }
  const fields = declared as Readonly<Record<string, LiteralValue>>;
  const method = "method" in fields ? fields["method"] : "GET";
  const path = fields["path"];
  return method === "GET" && typeof path === "string" ? path : undefined;
}
