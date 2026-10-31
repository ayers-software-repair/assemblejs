// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lstatSync } from "node:fs";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";

/** Source editing excludes generated/metadata files and refuses linked path components. */
export function sourceFilePath(root: ProjectRoot, path: string): string {
  const parts = path.split("/");
  if (
    (path !== "assemblejs.config.ts" && !path.startsWith("src/")) ||
    path.includes("\\") ||
    path.includes("\0") ||
    path.includes(":") ||
    parts.some((part) => part === "" || part.startsWith("."))
  )
    throw new Error("edit a source file under src/ or assemblejs.config.ts");
  for (let index = 0; index < parts.length; index++) {
    const file = withinRoot(root, ...parts.slice(0, index + 1));
    const stat = lstatSync(file, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error("source editing refuses linked paths");
    if (stat !== undefined && (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory()))
      throw new Error("source path must name a regular file beneath directories");
  }
  return withinRoot(root, path);
}
