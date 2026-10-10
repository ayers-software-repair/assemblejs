// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { insideRoot } from "./inside-root.js";

/**
 * A file of the project, as text: the one way a reader opens one. A path that leads out of the
 * root is refused with OutsideRootError before anything is opened, so a reader never learns
 * what stood there, not even that it would not compile. The root and the file are taken as any
 * read takes a path, each from where it is asked.
 */
export function readInside(root: string, file: string): string {
  return readFileSync(insideRoot(resolve(root), resolve(file)), "utf8");
}
