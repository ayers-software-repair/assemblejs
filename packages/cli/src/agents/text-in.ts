// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { readInside } from "../root/read-inside.js";

/**
 * Reads a project's own files as text, each by its path from the project's root: undefined for
 * one the project does not have, that is not a file to read, or that leads out of the project,
 * which is not opened.
 */
export function textIn(root: string): (path: string) => string | undefined {
  return (path) => {
    try {
      return readInside(root, join(root, path));
    } catch {
      return undefined;
    }
  };
}
