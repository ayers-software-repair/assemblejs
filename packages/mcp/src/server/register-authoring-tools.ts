// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addAssembly } from "../author/add-assembly.js";
import { checkRoot } from "../author/check-root.js";
import { createProject } from "../author/create-project.js";
import { placeOnPage } from "../author/place-on-page.js";
import type { ProjectRoot } from "../root/project-root.js";
import type { ToolResult } from "./tool-result.js";

const json = (value: ToolResult) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

/**
 * The tools that change a project, and the one that checks it: the command line's own logic,
 * bound to the protocol. Each answers with every file it wrote and the state that resulted. None
 * runs a shell, publishes or deploys; those stay in the command line, where a person types them.
 */
export function registerAuthoringTools(server: McpServer, root: ProjectRoot): void {
  server.registerTool(
    "create_project",
    {
      title: "Scaffold a project that runs",
      description:
        "Writes the smallest project that runs into this root: one page placing one assembly, and no framework nobody asked for. Refuses a root that already holds a project.",
      inputSchema: { name: z.string().describe("the package name, lower case with hyphens") },
    },
    ({ name }) => json(createProject(root, name)),
  );

  server.registerTool(
    "add_assembly",
    {
      title: "Add an assembly",
      description:
        "Writes an assembly for a named renderer and returns the files and the tag that places it. A directory is an assembly: nothing else is edited to register it.",
      inputSchema: {
        name: z.string().describe("the assembly's name, which becomes its directory"),
        renderer: z.string().describe("html, react or svelte").default("html"),
      },
    },
    ({ name, renderer }) => json(addAssembly(root, name, renderer)),
  );

  server.registerTool(
    "place_assembly",
    {
      title: "Place an assembly on a page",
      description:
        "Puts <assembly name=...> into a page's template at a named position, and returns the change. The page and the assembly must exist; the answer lists the ones that do when they do not.",
      inputSchema: {
        page: z.string().describe("the page's name, which is its directory under src/pages"),
        name: z.string().describe("the assembly to place"),
        at: z.enum(["start", "end"]).optional().describe("the start or end of the body"),
        after: z.string().optional().describe("place it after this assembly's placement"),
        before: z.string().optional().describe("place it before this assembly's placement"),
      },
    },
    ({ page, name, at, after, before }) =>
      json(
        placeOnPage(
          root,
          page,
          name,
          after !== undefined ? { after } : before !== undefined ? { before } : { at: at ?? "end" },
        ),
      ),
  );

  server.registerTool(
    "check",
    {
      title: "Check the project",
      description:
        "Runs the checks in process and returns every finding with its file, its rule and its fix. Nothing is built and no shell is run.",
      inputSchema: {},
    },
    () => json(checkRoot(root)),
  );
}
