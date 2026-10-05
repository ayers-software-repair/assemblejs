// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { readNamedExport } from "./read-named-export.js";
import { viewScript } from "./view-script.js";

/**
 * The mount mode a framework view declares for itself, `export const mount = "none"` and the
 * like, read from its source and never run, as the registry reads the export at run time. A
 * string where one is written; undefined where the view declares none, computes it, or cannot
 * be read, which the registry resolves at run time and `check` takes as a view that mounts.
 */
export function readViewMount(file: string): string | undefined {
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
  const script = viewScript(file, source);
  if (script === undefined) return undefined;
  try {
    const mount = readNamedExport(script.code, "mount", script.loader);
    return typeof mount === "string" ? mount : undefined;
  } catch {
    return undefined;
  }
}
