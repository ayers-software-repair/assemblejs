// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, realpathSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { OutsideRootError } from "./outside-root-error.js";
import type { ProjectRoot } from "./project-root.js";

/**
 * Resolves a path inside the project, or refuses.
 *
 * Every filesystem path a tool touches goes through here. The comparison is on the RESOLVED
 * path, not the given one, so `../` is settled before the check rather than after it: a guard
 * that inspects the argument instead of the destination is a guard that `a/../../etc/passwd`
 * walks straight past. And on where it really leads: a symbolic link inside the root that points
 * outside it is refused like the path it points to.
 */
export function withinRoot(root: ProjectRoot, ...segments: readonly string[]): string {
  const target = resolve(root.path, ...segments);
  if (!inside(root.path, target)) throw new OutsideRootError(segments.join("/"), root.path);
  // The string is inside; where it really leads is checked too. The nearest part of the path that
  // exists is resolved through every link, so a directory inside the root that links outside it
  // cannot carry a write out.
  // A root that does not exist yet holds no links to follow.
  if (!existsSync(root.path)) return target;
  let existing = target;
  while (!existsSync(existing) && dirname(existing) !== existing) existing = dirname(existing);
  const real = realpathSync(root.path);
  if (!inside(real, realpathSync(existing))) {
    throw new OutsideRootError(segments.join("/"), root.path);
  }
  return target;
}

function inside(root: string, target: string): boolean {
  const step = relative(root, target);
  return step === "" || !(step.startsWith("..") || resolve(step) === step);
}
