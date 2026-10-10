// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import type { LiteralValue } from "./literal-value.js";
import { readNamedExport } from "./read-named-export.js";
import { viewScript } from "./view-script.js";

/**
 * What a framework view exports under a name for the registry to read, `mount` or `shadow`,
 * as far as it is written as a literal: read from its source and never run. Undefined where
 * the view declares none, computes it, or cannot be read, which the registry resolves at run
 * time.
 */
export function readViewExport(file: string, name: string): LiteralValue {
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
  const script = viewScript(file, source);
  if (script === undefined) return undefined;
  try {
    return readNamedExport(script.code, name, script.loader);
  } catch {
    return undefined;
  }
}
