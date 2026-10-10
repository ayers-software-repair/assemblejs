// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reads a project's files as text, each by its path from the project's root: undefined for one
 * the project does not have, or that is not a file to read.
 */
export function textIn(root: string): (path: string) => string | undefined {
  return (path) => {
    try {
      return readFileSync(join(root, path), "utf8");
    } catch {
      return undefined;
    }
  };
}
