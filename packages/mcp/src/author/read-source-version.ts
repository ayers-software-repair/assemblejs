// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { sourceVersion } from "@asmjs/build";
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "../server/tool-result.js";

/** Read the build's source fingerprint without building or executing project code. */
export function readSourceVersion(root: ProjectRoot): ToolResult {
  return { ok: true, result: { version: sourceVersion(root.path) }, problems: [] };
}
