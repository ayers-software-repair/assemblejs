// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "../server/tool-result.js";
import { AssemblyReview } from "./assembly-review.js";

/** Adds an assembly immediately through the same planner and writer used by reviewed additions. */
export function addAssembly(root: ProjectRoot, name: string, renderer: string): ToolResult {
  const review = new AssemblyReview(root);
  const planned = review.plan(name, renderer);
  return planned.result === null ? planned : review.apply(planned.result.id);
}
