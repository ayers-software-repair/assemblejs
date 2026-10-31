// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "../server/tool-result.js";
import { sourceBytes } from "./source-bytes.js";
import { sourceFilePath } from "./source-file-path.js";

/** Reads actual confined UTF-8 source, never a generated bundle or host metadata. */
export function readSource(root: ProjectRoot, path: string): ToolResult {
  try {
    const bytes = sourceBytes(sourceFilePath(root, path));
    const contents = bytes.toString("utf8");
    if (!Buffer.from(contents, "utf8").equals(bytes)) throw new Error("source must be UTF-8 text");
    return { ok: true, result: { path, contents }, problems: [] };
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    return {
      ok: false,
      result: missing ? { path, missing: true } : null,
      problems: [String(error)],
    };
  }
}
