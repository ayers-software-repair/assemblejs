// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RENDERERS } from "@assemblejs/cli";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addAssembly } from "../author/add-assembly.js";
import { checkRoot } from "../author/check-root.js";
import { createProject } from "../author/create-project.js";
import { placeInView } from "../author/place-in-view.js";
import { placeOnPage } from "../author/place-on-page.js";
import type { ProjectRoot } from "../root/project-root.js";
import { answering } from "./answering.js";
import type { ToolResult } from "./tool-result.js";

/**
 * The tools that change a project, and the one that checks it: the command line's own logic,
 * bound to the protocol. Each answers with every file it wrote and the state that resulted. None
 * runs a shell, publishes or deploys; those stay in the command line, where a person types them.
 */
export function registerAuthoringTools(server: McpServer, root: ProjectRoot): void {
  // Each assembly is a resource of its own, so a tool that wrote one tells a client that listed
  // them to list again.
  const listedAgain = (result: ToolResult): ToolResult => {
    if (result.ok) server.sendResourceListChanged();
    return result;
  };

  server.registerTool(
    "create_project",
    {
      title: "Scaffold a project that runs",
      description:
        "Writes the smallest project that runs into this root: one page placing one assembly, and no framework nobody asked for. A README the root already holds is kept, and a .gitignore is added to. Refuses a root that holds anything else the starter would write, and names it.",
      inputSchema: { name: z.string().describe("the package name, lower case with hyphens") },
    },
    answering(({ name }) => listedAgain(createProject(root, name))),
  );

  server.registerTool(
    "add_assembly",
    {
      title: "Add an assembly",
      description:
        "Writes an assembly for a named renderer and returns the files and the tag that places it. A directory is an assembly: nothing else is edited to register it.",
      inputSchema: {
        name: z.string().describe("the assembly's name, which becomes its directory"),
        renderer: z.string().describe(RENDERERS.join(", ")).default("html"),
      },
    },
    answering(({ name, renderer }) => listedAgain(addAssembly(root, name, renderer))),
  );

  server.registerTool(
    "place_assembly",
    {
      title: "Place an assembly on a page, or inside another assembly",
      description: `Puts <assembly name="..."></assembly> into a page's template, or into another assembly's view, at a named position, and returns the change. Name the page or the assembly it goes in, one of the two. What is named must exist; the answer lists what does when it does not. A view its author writes as source is not edited: the answer is the line to write.`,
      inputSchema: {
        page: z
          .string()
          .optional()
          .describe("the page's name, which is its directory under src/pages"),
        in: z
          .string()
          .optional()
          .describe("in place of a page: the assembly whose view takes the placement"),
        name: z.string().describe("the assembly to place"),
        at: z.enum(["start", "end"]).optional().describe("the start or end of the body"),
        after: z.string().optional().describe("place it after this assembly's placement"),
        before: z.string().optional().describe("place it before this assembly's placement"),
      },
    },
    answering(({ page, in: parent, name, at, after, before }) => {
      const position =
        after !== undefined ? { after } : before !== undefined ? { before } : { at: at ?? "end" };
      if ((page === undefined) === (parent === undefined)) {
        return {
          ok: false,
          result: null,
          problems: ["name where it goes: a page, or the assembly it is placed in, and not both"],
        };
      }
      return parent === undefined
        ? placeOnPage(root, page ?? "", name, position)
        : placeInView(root, parent, name, position);
    }),
  );

  server.registerTool(
    "check",
    {
      title: "Check the project",
      description:
        "Runs the checks in process and returns every finding with its file, its rule and its fix. Nothing is built and no shell is run.",
      inputSchema: {},
    },
    answering(() => checkRoot(root)),
  );
}
