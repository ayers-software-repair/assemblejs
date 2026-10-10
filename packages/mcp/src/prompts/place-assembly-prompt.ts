// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { SEGMENT } from "@assemblejs/core";
import type { AgentPrompt } from "./agent-prompt.js";

/** Placing an assembly, on a page or in another assembly, and seeing what the placement made. */
export const PLACE_ASSEMBLY_PROMPT: AgentPrompt = {
  name: "place_assembly",
  title: "Place an assembly",
  description:
    "Places an assembly on a page or in another assembly's view, then composes it and reads the account of each placement.",
  arguments: [
    { name: "name", description: "the assembly to place", required: true, accepts: SEGMENT },
    {
      name: "on",
      description: "the page it goes on, or the assembly it goes in; asked for when not given",
      required: false,
      accepts: SEGMENT,
    },
  ],
  brief: ({ name = "", on }) =>
    `Place the assembly "${name}"${on === undefined ? "" : ` on "${on}"`}.

1. Read the resource assemblejs://project. "${name}" must be among its assemblies. If it is not, say so, and add it first only if that is what was meant.
2. ${
      on === undefined
        ? "You were not told where it goes. Ask which page, or which assembly, and do not choose one yourself. A page is a directory under src/pages."
        : `"${on}" is a page, which is a directory under src/pages, or another assembly. For a page, call place_assembly with { "page": "${on}", "name": "${name}" }. For an assembly, call it with { "in": "${on}", "name": "${name}" }. Named wrongly, the answer lists what exists: take from it only what is plainly meant, and ask otherwise.`
    }
3. Where in the body it stands is yours to say: "at" with "start" or "end", or "after" or "before" with the name of an assembly already placed there. The end, when you say nothing.
4. Placed in a view written in a framework, the answer is the line to write and what it imports, because that view is its author's source. Write the line where the child belongs.
5. See it. For a page, read src/pages/<page>/<page>.html and call compose_page with { "template": the file's text }. For an assembly, call render_assembly with { "name": the assembly's name }. Read the account of each placement and not only the markup: a placement that fell back looks the same in the markup as one that worked.
6. Call check, and fix every finding before you call this done.
`,
};
