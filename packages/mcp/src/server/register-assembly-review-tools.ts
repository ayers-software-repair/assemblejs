// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RENDERERS } from "@asmjs/build";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AssemblyReview } from "../author/assembly-review.js";
import type { ProjectRoot } from "../root/project-root.js";
import { answering } from "./answering.js";
import { notifyAuthoring } from "./notify-authoring.js";

/** Review tools retain their proposal in this server session, never in client-supplied file data. */
export function registerAssemblyReviewTools(server: McpServer, root: ProjectRoot): void {
  const review = new AssemblyReview(root);
  server.registerTool(
    "plan_assembly",
    {
      title: "Plan an assembly without writing",
      description:
        "Returns exact new-file contents for review. No project files are written. A new valid proposal replaces the previous pending proposal in this session. Does not place or check the assembly.",
      inputSchema: {
        name: z.string().describe("the assembly's lower-case directory name"),
        renderer: z.string().describe(RENDERERS.join(", ")).default("html"),
      },
    },
    answering(({ name, renderer }) => review.plan(name, renderer)),
  );
  server.registerTool(
    "apply_assembly_plan",
    {
      title: "Apply a reviewed assembly plan",
      description:
        "Writes the exact retained additions for this session's pending id, once only. Refuses an occupied target instead of replacing outside work. In approval mode, the client must obtain the person's approval before calling this tool. Run check and inspect the result afterward.",
      inputSchema: { id: z.string().describe("the id returned with the reviewed plan") },
    },
    answering(({ id }) => notifyAuthoring(server, review.apply(id))),
  );
  server.registerTool(
    "discard_assembly_plan",
    {
      title: "Reject an assembly plan",
      description: "Discards this session's pending proposal without writing any project files.",
      inputSchema: { id: z.string().describe("the id of the plan to reject") },
    },
    answering(({ id }) => review.discard(id)),
  );
}
