// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { isDirectory } from "./is-directory.js";

/**
 * Whether a project has TypeScript of its own outside its assemblies and its server file: a
 * page's declaration, an api, a module the views share. The written TypeScript setup gives
 * those files a project of their own, which every other project reads, and the compiler
 * refuses a project with no file in it, so none is written for a project that has none. A
 * file that names an owner of JSX in its name is that owner's, and is not counted here.
 */
export function hasSharedSources(root: string, owners: readonly string[]): boolean {
  const owned = new RegExp(`\\.(${owners.join("|")})\\.tsx$`);
  const typed = (file: string): boolean =>
    /\.tsx?$/.test(file) && (owners.length === 0 || !owned.test(file));
  const within = (dir: string, skip: readonly string[]): boolean => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return false;
    }
    return entries.some((entry) => {
      if (skip.includes(entry)) return false;
      const at = join(dir, entry);
      return isDirectory(at) ? within(at, []) : typed(entry);
    });
  };
  return within(join(root, "src"), ["assemblies", "server.ts"]);
}
