// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, lstatSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * The first link along a path inside a project that leads nowhere, or nothing where every link
 * along it leads somewhere and where the path is not written yet.
 *
 * Asked a step at a time from the root down, since a path beneath a link to nothing is as
 * unreadable as the link: a read of either fails as the system fails it, and a write makes a
 * file or a directory where the link points, which nobody was looking at.
 */
export function deadLink(root: string, path: string): string | undefined {
  let at = root;
  for (const step of relative(root, path).split(sep)) {
    if (step === "") continue;
    at = join(at, step);
    let link: boolean;
    try {
      link = lstatSync(at).isSymbolicLink();
    } catch {
      // Nothing is here, so nothing beneath it is a link.
      return undefined;
    }
    if (link && !existsSync(at)) return at;
  }
  return undefined;
}
