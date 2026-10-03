// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { checkProject } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "../server/tool-result.js";

/**
 * Runs the checks in process, never a shell, and answers every finding as a structure with the
 * file, the rule and the fix. `explain` answers why any of the rules exists.
 */
export function checkRoot(root: ProjectRoot): ToolResult {
  const findings = checkProject(root.path);
  return {
    ok: findings.length === 0,
    result: { findings },
    problems: findings,
    ...(findings.length === 0
      ? {}
      : { next: ["fix each finding, or ask explain why its rule exists"] }),
  };
}
