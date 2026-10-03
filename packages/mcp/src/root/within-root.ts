// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, relative, resolve, sep } from "node:path";
import { followLinks } from "./follow-links.js";
import { OutsideRootError } from "./outside-root-error.js";
import type { ProjectRoot } from "./project-root.js";

/**
 * Resolves a path inside the project, or refuses.
 *
 * Every filesystem path a tool touches goes through here. The comparison is on the RESOLVED
 * path, not the given one, so `../` is settled before the check rather than after it: a guard
 * that inspects the argument instead of the destination is a guard that `a/../../etc/passwd`
 * walks straight past. And on where it really leads: a symbolic link inside the root that points
 * outside it, existing or not, is refused like the path it points to.
 */
export function withinRoot(root: ProjectRoot, ...segments: readonly string[]): string {
  const target = resolve(root.path, ...segments);
  if (!inside(root.path, target)) throw new OutsideRootError(segments.join("/"), root.path);
  // The string is inside; where it really leads is checked too. Every link along the path is
  // followed, one that points at nothing included, so no link inside the root can carry a write
  // out of it.
  let real: string;
  try {
    real = followLinks(target);
  } catch {
    throw new OutsideRootError(segments.join("/"), root.path);
  }
  if (!inside(followLinks(root.path), real)) {
    throw new OutsideRootError(segments.join("/"), root.path);
  }
  return target;
}

function inside(root: string, target: string): boolean {
  const step = relative(root, target);
  return step === "" || !(step === ".." || step.startsWith(`..${sep}`) || isAbsolute(step));
}
