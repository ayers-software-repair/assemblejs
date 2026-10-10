// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RENDERERS } from "../commands/renderers.js";
import { RULES } from "../rules/rules.js";
import { AGENT_SERVER } from "./agent-server.js";
import { INSTRUCTION_MARKERS } from "./instruction-markers.js";
import { MCP_REGISTRATIONS } from "./mcp-registrations.js";

const registered = MCP_REGISTRATIONS.map((registration) => `\`${registration.path}\``);
// A rule's sentence names markup and paths with a part in angle brackets, which a Markdown
// reader takes for a tag and drops from what it shows. Each is written as code.
const BRACKETED = /(?:[\w./-]*<[^<>\n]+>)+[\w./-]*/g;

/**
 * What an agent that opens a project is told before it writes anything: what the project is in
 * the framework's own words, how to ask it and change it, and every rule its code must satisfy,
 * each from the one list the agent surface explains.
 *
 * Written between the two comments `check` finds it by, and the same for every project, so it
 * is current or it is not. Every `@` in it stands in a code span, since Claude Code reads one
 * written anywhere else in an instruction file as a file to import, and so does every `<`,
 * since the file is Markdown to the people who read it.
 */
export function agentInstructions(): string {
  return `${INSTRUCTION_MARKERS.begin}

## What this project is

An AssembleJS project. Its pages are composed on the server from assemblies, each written in
one framework or in none, and each hydrated in the browser by its own framework.

- A **page** is a directory under \`src/pages\`. \`home/home.html\` is the whole document served at
  \`/\`, and \`about/about.html\` the one at \`/about\`. A \`home.page.ts\` beside the template declares
  what the template cannot: another route, the policy for a placement, the page's stream.
- An **assembly** is a directory under \`src/assemblies\`, and its view is the file named after
  it: \`cart/cart.html\`, or \`cart.react.tsx\`, \`cart.vue\`, \`cart.svelte\` and the like, where the
  file's name says what renders it. Nothing registers an assembly, and \`src/server.ts\` never
  changes.
- A page **places** an assembly by writing \`<assembly name="cart"></assembly>\` in its template.
  A view places another assembly the same way: a template writes the tag, and a framework view
  writes the \`Slot\` its renderer's \`/client\` exports, which Svelte and Lit call \`slot\`. The
  name is written where the placement is, never computed.
- A **service**, \`cart/cart.service.ts\`, runs on the server before the view renders and returns
  the view's data.
- An **api** is a file \`src/api/<name>.api.ts\`: a route that answers data, as JSON or as a
  stream.

## How to work in it

- Ask the project before you assume. Its MCP server, \`${AGENT_SERVER.name}\`, is registered in
  ${registered.slice(0, -1).join(", ")} and ${registered.at(-1) ?? ""}. A client that reads none of them
  starts it from this directory with \`node ${AGENT_SERVER.path}\`. Read
  \`assemblejs://project\` for the assemblies that exist and \`assemblejs://rules\` for every rule
  with its reason.
- Change the project with its tools: \`add_assembly\`, then \`place_assembly\` on a page or in
  another assembly's view. Then see what you made, with no server started: \`render_assembly\`
  renders one assembly and \`compose_page\` a page's template, each with an account of every
  placement. \`check\` reports every problem with its file, its rule and its fix, and \`explain\`
  gives the reason behind a rule.
- From a shell the same work is \`npx assemblejs add assembly <name> --renderer <renderer>\` and
  \`npx assemblejs check\`. The renderers:
  ${RENDERERS.join(", ")}.
- An assembly written in a framework needs that framework's renderer installed. \`check\` names
  the package when it is missing.
- Run \`check\` before you call anything done. It builds nothing.
- \`npx assemblejs dev\` builds, serves and rebuilds on every change. \`npx assemblejs build\`
  writes \`dist/server.js\`, which is what production runs, under plain node.
- This part of the file is written by \`npx assemblejs add agents\` and held current by \`check\`.
  Put this project's own instructions outside it.

## The rules

Each is a constraint this project's code must satisfy, with a reason \`explain\` gives.

${RULES.map((rule) => `- \`${rule.id}\`: ${rule.rule.replace(BRACKETED, "`$&`")}`).join("\n")}

${INSTRUCTION_MARKERS.end}`;
}
