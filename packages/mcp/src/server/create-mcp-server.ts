// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { AGENT_SERVER, RULES, findRule, ownVersion } from "@assemblejs/cli";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { composePage } from "../compose/compose-page.js";
import { renderAssembly } from "../render/render-assembly.js";
import type { ProjectRoot } from "../root/project-root.js";
import { registerAuthoringTools } from "./register-authoring-tools.js";
import { registerPrompts } from "./register-prompts.js";
import { registerResources } from "./register-resources.js";

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
  const server = new McpServer({ name: AGENT_SERVER.name, version: ownVersion(import.meta.url) });

  registerResources(server, root);

  server.registerTool(
    "render_assembly",
    {
      title: "Render one assembly now",
      description:
        "Renders an assembly whose view is plain html and returns the envelope the server would emit, with every assembly its view places composed inside it, the account of each, and any problems. Nothing of the project's is run here: no service, so its data is empty, and no view in a framework or a template language, which is answered with the reason and seen from the running server. Use it right after writing one, to see what it actually produced rather than guessing.",
      inputSchema: { name: z.string().describe("the assembly's name, which is its directory") },
    },
    async ({ name }) => {
      const rendered = await renderAssembly(root, name);
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
        "Composes a page template against the assemblies on disk and returns the html with one diagnostic per placement, and beneath it one per assembly that placement's own view placed. A placement that fell back looks identical in the markup; the diagnostic is what says it did. An assembly whose view is not plain html falls back here, with the reason among the problems.",
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

  registerAuthoringTools(server, root);
  registerPrompts(server);
  return server;
}
