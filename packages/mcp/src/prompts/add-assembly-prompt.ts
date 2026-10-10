// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RENDERERS } from "@assemblejs/cli";
import { SEGMENT } from "@assemblejs/core";
import type { AgentPrompt } from "./agent-prompt.js";

/** Adding an assembly: scaffolded, written, seen, and placed or said not to be. */
export const ADD_ASSEMBLY_PROMPT: AgentPrompt = {
  name: "add_assembly",
  title: "Add an assembly",
  description:
    "Adds an assembly for a named renderer, shows what it renders, and leaves it placed or says that it is not.",
  arguments: [
    {
      name: "name",
      description: "the assembly's name, which becomes its directory",
      required: true,
      accepts: SEGMENT,
    },
    {
      name: "renderer",
      description: `what renders it, html when not given: ${RENDERERS.join(", ")}`,
      required: false,
      accepts: RENDERERS,
    },
  ],
  brief: ({ name = "", renderer = "html" }) =>
    `Add an assembly named "${name}" to this project, rendered by ${renderer}.

1. Read the resource assemblejs://project. If "${name}" is among its assemblies already, say so and stop: an assembly is its directory, and this one exists.
2. Call add_assembly with { "name": "${name}", "renderer": "${renderer}" }. It answers with each file it wrote and the tag that places the assembly. A refusal names the rule it broke and the fix: take the fix.
3. Write the view it scaffolded into what was asked for, in ${renderer} and nothing else: an assembly is written in one framework. Data for its first render comes from a service beside the view, src/assemblies/${name}/${name}.service.ts, which runs on the server.
4. Call render_assembly with { "name": "${name}" }. A plain html view comes back rendered. A view in a framework or a template language comes back with the reason it was not: it is source its renderer compiles. For one of those, call check, which names the renderer's package when it is not installed, and see the view from the running server.
5. An assembly is on no page until it is placed. If you were told where this one goes, call place_assembly with it. If you were not, say that it is not placed yet and ask where it belongs.
6. Call check, and fix every finding before you call this done.
`,
};
