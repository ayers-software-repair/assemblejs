// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { insideRoot } from "@assemblejs/cli";
import type { ProjectRoot } from "./project-root.js";

/**
 * Resolves a path inside the project, or refuses, by the one definition the command line's
 * readers hold every file to: on the resolved path, and on where it really leads, every link
 * followed, so that neither `../` nor a link inside the root carries a read or a write out of
 * it. Every path a tool touches goes through here, and takes a root that has been resolved.
 */
export function withinRoot(root: ProjectRoot, ...segments: readonly string[]): string {
  return insideRoot(root.path, ...segments);
}
