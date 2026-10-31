// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { RENDERERS, docsAddress, ownVersion } from "@asmjs/build";
import { RULES } from "../rules/rules.js";
import { AGENT_SERVER } from "./agent-server.js";
import { INSTRUCTION_MARKERS } from "./instruction-markers.js";
import { MCP_REGISTRATIONS } from "./mcp-registrations.js";

const registered = MCP_REGISTRATIONS.map((registration) => `\`${registration.path}\``);
// A rule's sentence names markup and paths with a part in angle brackets, which a Markdown
// reader takes for a tag and drops from what it shows, and packages by a scoped name, whose
// @ a client would show as a mention. Each is written as code.
const BRACKETED = /(?:[\w./-]*<[^<>\n]+>)+[\w./-]*|@[\w-]+\/[\w.-]+/g;

/**
 * What an agent that opens a project is told before it writes anything: what the project is in
 * the framework's own words, how to ask it and change it, and every rule its code must satisfy,
 * each from the one list the agent surface explains.
 *
 * It opens with where the documentation is for the channel this version was published on. It is
 * written between the two comments `check` finds it by, and the same for every project, so it
 * is current or it is not. Every `@` in it stands in a code span, since Claude Code reads one
 * written anywhere else in an instruction file as a file to import, and so does every `<`,
 * since the file is Markdown to the people who read it.
 */
export function agentInstructions(): string {
  const docs = docsAddress(ownVersion(import.meta.url));
  return `${INSTRUCTION_MARKERS.begin}

The documentation a model can read is at ${docs}llms.txt, and its full text at ${docs}llms-full.txt.

## What this project is

An AssembleJS project. Its pages are composed on the server from assemblies, each written in
one framework or in none, and each hydrated in the browser by its own framework.

- A **page** is a directory under \`src/pages\`. \`home/home.html\` is the whole document served at
  \`/\`, and \`about/about.html\` the one at \`/about\`. A \`home.page.ts\` beside the template declares
  what the template cannot: another route, the policy for a placement, the page's stream.
  A page named \`not-found\` has no route: it answers, under a 404, wherever nothing else does.
- An **assembly** is a directory under \`src/assemblies\`, and its view is the file named after
  it: \`cart/cart.html\`, or \`cart.react.tsx\`, \`cart.vue\`, \`cart.svelte\` and the like, where the
  file's name says what renders it. Nothing registers an assembly, and \`src/server.ts\` never
  changes.
- A page **places** an assembly by writing \`<assembly name="cart"></assembly>\` in its template.
  A view places another assembly the same way: a template writes the tag, and a framework view
  writes the \`Slot\` its renderer's \`/client\` exports, which Svelte and Lit call \`slot\`. The
  name is written where the placement is, never computed.
- A **service**, \`cart/cart.service.ts\`, runs on the server before the view renders and returns
  the view's data. A view writes that data escaped, as every renderer does by default. Written
  with a raw form it is markup, and an \`<assembly>\` in it is placed like one the view wrote,
  so nothing a visitor sent is written raw. A service whose thing does not exist throws
  \`new NotFound()\`, from \`@asmjs/core\`, and its page answers 404 with the not-found page.
- An **api** is a file \`src/api/<name>.api.ts\`: a route that answers data, as JSON or as a
  stream. Only an api is given the request's headers and cookies, and \`reply(...)\` lets it answer a
  status, a cookie or a redirect; a service and a page are a function of the address.
  An assembly's browser half calls its own server's apis as \`fetch(api("/api/..."))\`,
  with \`api\` from \`@asmjs/core/client\`, so the call also works when a page on another
  server placed the assembly.

## How to work in it

- Ask the project before you assume. Its MCP server, \`${AGENT_SERVER.name}\`, is registered in
  ${registered.slice(0, -1).join(", ")} and ${registered.at(-1) ?? ""}. A client that reads none of them
  starts it from this directory with \`node ${AGENT_SERVER.path}\`: Codex with
  \`codex mcp add ${AGENT_SERVER.name} -- node ${AGENT_SERVER.path}\`, JetBrains AI Assistant and Zed
  with the entry of \`.mcp.json\` pasted into their MCP settings. Read
  \`assemblejs://project\` for every page, assembly and api and how they are wired,
  \`assemblejs://assembly/<name>\` for one assembly and where it is placed,
  \`assemblejs://rules\` for every rule with its reason, and \`assemblejs://contract\` for the
  three endpoints, their headers and the envelope, when an assembly is served from another server.
- For a reviewable addition, \`plan_assembly\` returns exact proposed files without writing.
  A new valid plan replaces this session's pending plan. In approval mode, show those changes
  and obtain the person's approval before calling \`apply_assembly_plan\` with its id.
  Reject with \`discard_assembly_plan\`. Applying refuses an occupied target and consumes the
  plan; after a conflict, request and review a fresh plan. These tools add an assembly only;
  they do not approve later edits or placement. The client controls whether a person approved.
- Read actual source with \`read_source\`. For reviewed additions or replacements, call
  \`apply_source_changes\` with exact before/after text; null before requires an absent file.
  Show those changes and obtain the person's approval in approval mode. A stale base is refused;
  inspect completed/attempted paths after a write failure and review fresh changes before retrying.
  These operations edit source under src/ and assemblejs.config.ts, not generated files or host
  metadata. They do not enforce a global mode, guarantee a multi-file transaction or protect
  against hostile filesystem replacement. Run check and verify the actual preview afterward.
- Change the project with its tools: \`add_assembly\`, then \`place_assembly\` on a page or in
  another assembly's view. Then see what you made: \`render_assembly\` renders an assembly and
  \`compose_page\` composes a page by its name, under the policy its declaration writes, each
  with an account of every placement. While the project's dev server runs
  (\`npx assemblejs dev\`), both ask it, so any view is shown as the project serves it, with the
  data its services returned. With none running, a plain html view is rendered on the spot and a
  view in a framework or a template language is answered with the reason: it is source its
  renderer compiles, so start the dev server and ask again.
  \`check\` reports every problem with its file, its rule and its fix, and \`explain\` gives the
  reason behind a rule.
- From a shell the same work is \`npx assemblejs add assembly <name> --renderer <renderer>\` and
  \`npx assemblejs check\`. The renderers:
  ${RENDERERS.join(", ")}.
- An assembly written in a framework needs that framework's renderer installed. \`check\` names
  the package when it is missing.
- Run \`check\` before you call anything done. It builds nothing. The build writes the project's
  TypeScript setup into \`.assemblejs/\`, one project for each framework's JSX, so no file names
  its framework: \`tsc -b\` after a build type-checks every file as its own framework's.
- \`npx assemblejs dev\` builds, serves and rebuilds on every change. \`npx assemblejs build\`
  writes \`dist/server.js\`, which is what production runs, under plain node.
- \`npx assemblejs perf\` weighs what each page sends before anything mounts and as its
  assemblies mount, held to \`budgets\`; a page with a parameter is weighed at its entry in \`addresses\`.
- This part of the file is written by \`npx assemblejs add agents\` and held current by \`check\`.
  Put this project's own instructions outside it.

## The rules

Each is a constraint this project's code must satisfy, with a reason \`explain\` gives.

${RULES.map((rule) => `- \`${rule.id}\`: ${rule.rule.replace(BRACKETED, "`$&`")}`).join("\n")}

${INSTRUCTION_MARKERS.end}`;
}
