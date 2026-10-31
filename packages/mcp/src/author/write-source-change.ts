// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import type { ProjectRoot } from "../root/project-root.js";
import { sourceBytes } from "./source-bytes.js";
import type { SourceChange } from "./source-change.js";
import { sourceFilePath } from "./source-file-path.js";

/** Recheck immediately before writing; failed replacement preparation preserves the original. */
export function writeSourceChange(root: ProjectRoot, change: SourceChange): void {
  const file = sourceFilePath(root, change.path);
  if (change.before === null) {
    mkdirSync(dirname(file), { recursive: true });
    sourceFilePath(root, change.path);
    const descriptor = openSync(file, "wx");
    try {
      if (!fstatSync(descriptor).isFile()) throw new Error("source must be a regular file");
      writeFileSync(descriptor, change.after, { encoding: "utf8" });
    } finally {
      closeSync(descriptor);
    }
    return;
  }
  const mode = lstatSync(file).mode & 0o777;
  if (!sourceBytes(file).equals(Buffer.from(change.before, "utf8")))
    throw new Error("source changed before writing");
  const temporary = join(dirname(file), `.assemblejs-edit-${randomUUID()}.tmp`);
  let created = false;
  try {
    const descriptor = openSync(temporary, "wx", mode);
    created = true;
    try {
      writeFileSync(descriptor, change.after, { encoding: "utf8" });
    } finally {
      closeSync(descriptor);
    }
    chmodSync(temporary, mode);
    sourceFilePath(root, change.path);
    if (!sourceBytes(file).equals(Buffer.from(change.before, "utf8")))
      throw new Error("source changed before replacement");
    renameSync(temporary, file);
    created = false;
  } finally {
    if (created) unlinkSync(temporary);
  }
}
