// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AgentPrompt } from "./agent-prompt.js";

/** Fixing what `check` finds: one finding at a time, by its own fix, until there is none. */
export const FIX_FINDINGS_PROMPT: AgentPrompt = {
  name: "fix_findings",
  title: "Fix what check finds",
  description:
    "Runs check and fixes each finding by the fix it names, one at a time, until check finds nothing.",
  arguments: [],
  brief: () =>
    `Fix what check finds in this project.

1. Call check. With no findings, say so and stop.
2. Take the findings one at a time. Each names its file, the rule it breaks, what is wrong, and the fix that puts it right.
3. Where the fix is not enough to act on, call explain with { "id": the finding's rule }. It answers why the rule exists and what breaking it looks like.
4. Make the change the fix names, in the file the finding names, and nothing wider. Do not clear a finding by removing the placement, the page or the assembly it is about, unless that is the fix.
5. A fix that is a command, an install or "assemblejs add agents", is for a shell, and this server runs none. Run it yourself, or say that it needs running.
6. Call check again after each change: one fix can clear several findings, and can uncover another.
7. Stop when check answers with no findings, and say what you changed, file by file.
`,
};
