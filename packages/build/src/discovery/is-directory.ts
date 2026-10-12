// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { statSync } from "node:fs";

/**
 * Whether a path is a directory now. A dangling link, or a directory gone between listing it and
 * reading it (a branch switch mid-build), is answered false rather than thrown, so discovering a
 * project never crashes on a tree that is changing under it.
 */
export function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
