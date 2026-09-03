// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { composePage } from "../compose/compose-page.js";
import { renderAssembly } from "../render/render-assembly.js";
import type { ProjectRoot } from "../root/project-root.js";
import { findRule } from "../rules/find-rule.js";
import { RULES } from "../rules/rules.js";
import { describeProject } from "./describe-project.js";

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

/**
 * The agent surface, wired to the protocol.
 *
 * Everything here is a thin binding over functions that are tested without it: the protocol is
 * a transport, and a transport is not where behaviour should live. Nothing in this file runs a
 * shell, publishes, deploys, or reaches a network, and nothing holds a credential.
 */
export function createMcpServer(root: ProjectRoot): McpServer {
  const server = new McpServer({ name: "assemblejs", version: "1.0.0" });

  server.registerResource(
    "project",
    "assemblejs://project",
    {
      title: "This project",
      description:
        "Every assembly, its renderer and its view, plus anything wrong with the tree. One read, so an agent does not spend its first turns asking what exists.",
      mimeType: "application/json",
    },
    () => ({
      contents: [
        {
          uri: "assemblejs://project",
          mimeType: "application/json",
          text: JSON.stringify(describeProject(root), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "rules",
    "assemblejs://rules",
    {
      title: "The rules real code must satisfy",
      description:
        "Each with the reason it exists and what it looks like when broken. An agent that knows only a rule complies; one that knows why can tell when it is looking at the situation the rule was written for.",
      mimeType: "application/json",
    },
    () => ({
      contents: [
        {
          uri: "assemblejs://rules",
          mimeType: "application/json",
          text: JSON.stringify(RULES, null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    "render_assembly",
    {
      title: "Render one assembly now",
      description:
        "Renders an assembly and returns the real envelope the server would emit, its data and any problems. Use it right after writing one, to see what it actually produced rather than guessing.",
      inputSchema: { name: z.string().describe("the assembly's name, which is its directory") },
    },
    ({ name }) => {
      const rendered = renderAssembly(root, name);
      return json({
        ok: rendered.problems.length === 0,
        result: rendered,
        problems: rendered.problems,
        next:
          rendered.problems.length === 0
            ? [`place it on a page with <assembly name="${name}"></assembly>`]
            : [],
      });
    },
  );

  server.registerTool(
    "compose_page",
    {
      title: "Compose a page now",
      description:
        "Composes a page template against the assemblies on disk and returns the html with one diagnostic per placement. A placement that fell back looks identical in the markup; the diagnostic is what says it did.",
      inputSchema: {
        template: z.string().describe('the page template, with <assembly name="..."> placements'),
      },
    },
    async ({ template }) => {
      const composed = await composePage(root, template);
      return json({
        ok: composed.problems.length === 0,
        result: composed,
        problems: composed.problems,
      });
    },
  );

  server.registerTool(
    "explain",
    {
      title: "Why a rule exists",
      description:
        "The reason behind one of the framework's rules, so an agent can decide rather than comply.",
      inputSchema: { id: z.string().describe("the rule's id, from assemblejs://rules") },
    },
    ({ id }) => {
      const rule = findRule(id);
      return json({
        ok: rule !== undefined,
        result: rule ?? null,
        problems:
          rule === undefined
            ? [`there is no rule "${id}". The ids are: ${RULES.map((r) => r.id).join(", ")}`]
            : [],
      });
    },
  );

  return server;
}
