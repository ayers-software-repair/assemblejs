// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { relative, resolve } from "node:path";
import { OutsideRootError } from "./outside-root-error.js";
import type { ProjectRoot } from "./project-root.js";

/**
 * Resolves a path inside the project, or refuses.
 *
 * Every filesystem path a tool touches goes through here. The comparison is on the RESOLVED
 * path, not the given one, so `../` and a symlink-shaped string are both settled before the
 * check rather than after it: a guard that inspects the argument instead of the destination is
 * a guard that `a/../../etc/passwd` walks straight past.
 */
export function withinRoot(root: ProjectRoot, ...segments: readonly string[]): string {
  const target = resolve(root.path, ...segments);
  const step = relative(root.path, target);
  if (step.startsWith("..") || resolve(step) === step) {
    throw new OutsideRootError(segments.join("/"), root.path);
  }
  return target;
}
