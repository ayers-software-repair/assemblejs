// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readViewExport } from "./read-view-export.js";

/**
 * The mount mode a framework view declares for itself, `export const mount = "none"` and the
 * like, read from its source and never run, as the registry reads the export at run time. A
 * string where one is written; undefined where the view declares none, computes it, or cannot
 * be read, which the registry resolves at run time and `check` takes as a view that mounts.
 */
export function readViewMount(root: string, file: string): string | undefined {
  const mount = readViewExport(root, file, "mount");
  return typeof mount === "string" ? mount : undefined;
}
