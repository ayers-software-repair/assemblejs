// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lstatSync } from "node:fs";
import { sep } from "node:path";
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "../server/tool-result.js";
import { sourceBytes } from "./source-bytes.js";
import type { SourceChange } from "./source-change.js";
import { sourceFilePath } from "./source-file-path.js";
import { writeSourceChange } from "./write-source-change.js";

/** Validates every expected base before writing; an I/O failure may leave an explicit partial batch. */
export function applySourceChanges(
  root: ProjectRoot,
  changes: readonly SourceChange[],
): ToolResult {
  const written: string[] = [];
  const attempted: string[] = [];
  try {
    if (changes.length === 0 || changes.length > 32)
      throw new Error("supply 1 to 32 source changes");
    const retained = changes.map((change) => ({ ...change }));
    const paths = new Set<string>();
    let bytes = 0;
    for (const change of retained) {
      if (
        typeof change.after !== "string" ||
        (change.before !== null && typeof change.before !== "string")
      )
        throw new Error("source changes require text and an expected previous value");
      for (const text of [change.after, change.before ?? ""]) {
        const encoded = Buffer.from(text, "utf8");
        if (encoded.length > 65536 || encoded.toString("utf8") !== text)
          throw new Error("each source value must be valid UTF-8 text of at most 65536 bytes");
        bytes += encoded.length;
      }
      if (bytes > 131072) throw new Error("source changes are limited to 131072 bytes in total");
      const file = sourceFilePath(root, change.path);
      if (
        [...paths].some(
          (path) => path === file || path.startsWith(file + sep) || file.startsWith(path + sep),
        )
      )
        throw new Error("source paths must not repeat or contain another changed file");
      paths.add(file);
      const occupied = lstatSync(file, { throwIfNoEntry: false });
      if (
        change.before === null
          ? occupied !== undefined
          : occupied === undefined || !sourceBytes(file).equals(Buffer.from(change.before, "utf8"))
      )
        throw new Error(`source changed since review: ${change.path}`);
    }
    for (const change of retained) {
      attempted.push(change.path);
      writeSourceChange(root, change);
      written.push(change.path);
    }
    return {
      ok: true,
      result: { written },
      problems: [],
      next: ["run check, then build and verify the actual preview"],
    };
  } catch (error) {
    return {
      ok: false,
      result: { written, attempted },
      problems: [String(error)],
      next: ["inspect attempted files and current source; review fresh changes before retrying"],
    };
  }
}
