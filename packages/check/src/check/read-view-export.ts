// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readInside } from "@asmjs/build";
import type { LiteralValue } from "./literal-value.js";
import { readNamedExport } from "./read-named-export.js";
import { viewScript } from "./view-script.js";

/**
 * What a framework view exports under a name for the registry to read, `mount` or `shadow`,
 * as far as it is written as a literal: read from its source and never run. Undefined where
 * the view declares none, computes it, or cannot be read, one that leads out of the project
 * included, which the registry resolves at run time.
 */
export async function readViewExport(
  root: string,
  file: string,
  name: string,
): Promise<LiteralValue> {
  let source: string;
  try {
    source = readInside(root, file);
  } catch {
    return undefined;
  }
  const script = viewScript(file, source);
  if (script === undefined) return undefined;
  try {
    return await readNamedExport(script.code, name, script.loader);
  } catch {
    return undefined;
  }
}
