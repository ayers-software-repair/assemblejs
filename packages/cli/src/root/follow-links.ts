// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lstatSync, readlinkSync } from "node:fs";
import { join, parse, resolve, sep } from "node:path";

const MOST_LINKS = 40;

/**
 * Where an absolute path really leads: every symbolic link along it is followed, a link that
 * points at nothing included, because a write through a dangling link creates the file at the
 * link's target. The part of the path that does not exist yet is carried over as written.
 * Throws on a chain of links too long to be anything but a loop.
 */
export function followLinks(path: string, hops = { left: MOST_LINKS }): string {
  const parts = path.split(sep).filter((part) => part !== "");
  let current = parse(path).root;
  for (const [at, part] of parts.entries()) {
    const next = join(current, part);
    let link: boolean;
    try {
      link = lstatSync(next).isSymbolicLink();
    } catch {
      return join(next, ...parts.slice(at + 1));
    }
    if (!link) {
      current = next;
      continue;
    }
    hops.left -= 1;
    if (hops.left < 0) throw new Error(`${path} leads through more than ${MOST_LINKS} links`);
    current = followLinks(resolve(current, readlinkSync(next)), hops);
  }
  return current;
}
