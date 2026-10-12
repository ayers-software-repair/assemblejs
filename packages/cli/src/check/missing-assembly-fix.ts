// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * What to do about a placement that names no assembly: add it, or place one that exists.
 *
 * Unless a directory of that name is there. Then it is one that is not an assembly yet, with a
 * finding of its own that says why, and `add` would refuse the name as taken: told to add it,
 * a person or an agent went round between the two for good.
 */
export function missingAssemblyFix(root: string, name: string, names: readonly string[]): string {
  if (existsSync(join(root, "src", "assemblies", name))) {
    return `src/assemblies/${name} is there and is not an assembly yet: mend what is said of that directory`;
  }
  return names.length === 0
    ? `add it: assemblejs add assembly ${name}`
    : `add it, or place one that exists: ${names.join(", ")}`;
}
