// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import { insideRoot } from "./inside-root.js";
import { OutsideRootError } from "./outside-root-error.js";

/**
 * Whether a path leaves the project: written outside its root, or a link, or beneath a link,
 * that leads out of it. Asked before a directory is listed or a file is named, so that what is
 * outside is not so much as looked at.
 *
 * The root and the path are taken as a read would take them, each from where it is asked: a
 * reader hands this the path it was about to open, and a root that is not whole must not send
 * the question to another path than the read would have gone to.
 */
export function leadsOut(root: string, path: string): boolean {
  try {
    insideRoot(resolve(root), resolve(path));
    return false;
  } catch (error) {
    if (error instanceof OutsideRootError) return true;
    throw error;
  }
}
