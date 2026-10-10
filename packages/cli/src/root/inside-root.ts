// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, relative, resolve, sep } from "node:path";
import { followLinks } from "./follow-links.js";
import { OutsideRootError } from "./outside-root-error.js";

/**
 * Resolves a path inside a project, or refuses.
 *
 * Every file the readers open and every path a tool touches goes through here. The comparison
 * is on the RESOLVED path, not the given one, so `../` is settled before the check rather than
 * after it: a guard that inspects the argument instead of the destination is a guard that
 * `a/../../etc/passwd` walks straight past. And on where it really leads: a symbolic link inside
 * the root that points outside it, existing or not, through however many links, is refused like
 * the path it points to. A link that stays inside the root is a path like any other.
 */
export function insideRoot(root: string, ...segments: readonly string[]): string {
  const target = resolve(root, ...segments);
  const attempted = segments.join("/");
  if (!within(resolve(root), target)) throw new OutsideRootError(attempted, root);
  // The string is inside; where it really leads is checked too. Every link along the path is
  // followed, one that points at nothing included, so no link inside the root can carry a read
  // or a write out of it.
  let real: string;
  try {
    real = followLinks(target);
  } catch {
    throw new OutsideRootError(attempted, root);
  }
  if (!within(followLinks(resolve(root)), real)) throw new OutsideRootError(attempted, root);
  return target;
}

function within(root: string, target: string): boolean {
  const step = relative(root, target);
  return step === "" || !(step === ".." || step.startsWith(`..${sep}`) || isAbsolute(step));
}
