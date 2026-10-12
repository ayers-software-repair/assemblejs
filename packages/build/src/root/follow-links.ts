// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lstatSync, readlinkSync } from "node:fs";
import { dirname, isAbsolute, join, parse, sep } from "node:path";

const MOST_LINKS = 40;

/**
 * Where an absolute path really leads, read a step at a time as the system that opens it reads
 * it: every symbolic link along it is followed, a link that points at nothing included, because
 * a write through a dangling link creates the file at the link's target. A link's target is
 * walked the same way, a step at a time from where the link stands, so a link along the target
 * is followed before a step back that comes after it; read as text, `out/../note` would be
 * `note` beside the link, and the file really opened is another. The part of the path that does
 * not exist yet is carried over as written. Throws on a chain of links too long to be anything
 * but a loop.
 */
export function followLinks(path: string): string {
  const steps = (text: string): string[] => text.split(sep).filter((part) => part !== "");
  // The steps still to take, the next one last.
  const ahead = steps(path).reverse();
  let current = parse(path).root;
  let left = MOST_LINKS;
  for (let part = ahead.pop(); part !== undefined; part = ahead.pop()) {
    if (part === ".") continue;
    if (part === "..") {
      current = dirname(current);
      continue;
    }
    const next = join(current, part);
    let target: string | undefined;
    try {
      if (lstatSync(next).isSymbolicLink()) target = readlinkSync(next);
    } catch {
      return join(next, ...ahead.reverse());
    }
    if (target === undefined) {
      current = next;
      continue;
    }
    left -= 1;
    if (left < 0) throw new Error(`${path} leads through more than ${MOST_LINKS} links`);
    if (isAbsolute(target)) current = parse(target).root;
    ahead.push(...steps(target).reverse());
  }
  return current;
}
