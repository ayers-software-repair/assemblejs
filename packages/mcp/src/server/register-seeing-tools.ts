// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RULES, findRule } from "@assemblejs/cli";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArrivedWith } from "../compose/arrived-with.js";
import { composePage } from "../compose/compose-page.js";
import { renderAssembly } from "../render/render-assembly.js";
import type { ProjectRoot } from "../root/project-root.js";
import { answering } from "./answering.js";

// What a visitor arrives with, as both tools take it.
const ARRIVED = {
  params: z
    .record(z.string(), z.string())
    .optional()
    .describe('a value for each parameter of the page\'s route, by name: { "sku": "kb-250" }'),
  query: z
    .record(z.string(), z.string())
    .optional()
    .describe('the query a visitor arrives with, by name: { "grind": "espresso" }'),
};
const arrivedWith = (
  params: Readonly<Record<string, string>> | undefined,
  query: Readonly<Record<string, string>> | undefined,
): ArrivedWith => ({
  ...(params === undefined ? {} : { params }),
  ...(query === undefined ? {} : { query }),
});

/**
 * The tools that show a project as it renders, and the one that says why a rule exists. The
 * first two are why this surface is not a wrapper around the command line: an agent that has
 * written an assembly or a page sees what it produced, for the visitor it names, without
 * starting a server or asking a person to look. None changes anything.
 */
export function registerSeeingTools(server: McpServer, root: ProjectRoot): void {
  server.registerTool(
    "render_assembly",
    {
      title: "Render one assembly now",
      description:
        "Renders an assembly and returns the envelope the server would emit, with every assembly its view places composed inside it, the account of each, and any problems. While the project's dev server runs (npx assemblejs dev), that server renders it, framework and template views included, and nothing of the project's code runs here; without one, a plain html view is rendered here with no service, so its data is empty, and any other view is answered with the reason. Use it right after writing one, to see what it actually produced rather than guessing. Its services are given the params and the query of the call, as they are given a visitor's: say them for an assembly placed on a page whose route has a parameter.",
      inputSchema: {
        name: z.string().describe("the assembly's name, which is its directory"),
        params: ARRIVED.params,
        query: ARRIVED.query,
      },
    },
    answering(async ({ name, params, query }) => {
      const rendered = await renderAssembly(root, name, undefined, arrivedWith(params, query));
      return {
        ok: rendered.problems.length === 0,
        result: rendered,
        problems: rendered.problems,
        next:
          rendered.problems.length === 0
            ? [`place it on a page with <assembly name="${name}"></assembly>`]
            : [],
      };
    }),
  );

  server.registerTool(
    "compose_page",
    {
      title: "Compose a page now",
      description:
        "Composes one of the project's pages, by name, under the policy its declaration writes, and returns the html with one diagnostic per placement, and beneath it one per assembly that placement's own view placed. While the project's dev server runs, every placement is asked of it, so the page is what the project serves; without one, placements are composed from the assemblies on disk, and one whose view is not plain html falls back with the reason among the problems. A placement from another server is composed deferred, as the browser fills it; nothing is fetched. A placement that fell back looks identical in the markup; the diagnostic is what says it did. A page whose route has a parameter, /product/:sku, is composed for the visitor the call describes: give each parameter a value in params, and a query where the page reads one. One left out is said among the problems, as no visitor arrives without it.",
      inputSchema: {
        page: z.string().describe("the page's name, which is its directory under src/pages"),
        params: ARRIVED.params,
        query: ARRIVED.query,
      },
    },
    answering(async ({ page, params, query }) => {
      const composed = await composePage(root, page, arrivedWith(params, query));
      return {
        ok: composed.problems.length === 0,
        result: composed,
        problems: composed.problems,
      };
    }),
  );

  server.registerTool(
    "explain",
    {
      title: "Why a rule exists",
      description:
        "The reason behind one of the framework's rules, so an agent can decide rather than comply.",
      inputSchema: { id: z.string().describe("the rule's id, from assemblejs://rules") },
    },
    answering(({ id }) => {
      const rule = findRule(id);
      return {
        ok: rule !== undefined,
        result: rule ?? null,
        problems:
          rule === undefined
            ? [`there is no rule "${id}". The ids are: ${RULES.map((r) => r.id).join(", ")}`]
            : [],
      };
    }),
  );
}
