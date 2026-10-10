// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isDeepStrictEqual } from "node:util";
import { agentInstructions } from "./agent-instructions.js";
import { AGENT_SERVER } from "./agent-server.js";
import { AGENTS_IMPORT } from "./agents-import.js";
import { bringsInAgents } from "./brings-in-agents.js";
import { CLAUDE_FILES } from "./claude-files.js";
import { instructionsIn } from "./instructions-in.js";
import { MCP_REGISTRATIONS } from "./mcp-registrations.js";
import { registeredEntry } from "./registered-entry.js";

/**
 * What a project is written with for the agents that will work in it, as the files to write
 * given the ones it has: `AGENTS.md`, which says what the project is and the rules its code
 * must satisfy; a `CLAUDE.md` that brings it in, for Claude Code wherever it reads that file in
 * place of it; and its agent surface registered for each client that reads a registration.
 *
 * A project that has none of them is written all of them. In one that has some, only this
 * command line's own part of each is written: its marked part of `AGENTS.md`, the one import in
 * `CLAUDE.md`, its own server in a registration. A file that is already right is not among the
 * answer, and a registration that cannot be read is named in `unreadable` and never written.
 */
export function agentFiles(
  name: string,
  existing: (path: string) => string | undefined = () => undefined,
): { readonly files: Readonly<Record<string, string>>; readonly unreadable: readonly string[] } {
  const wanted: Record<string, string> = {};
  const unreadable: string[] = [];

  const instructions = agentInstructions();
  const agents = existing("AGENTS.md");
  const written = agents === undefined ? undefined : instructionsIn(agents);
  wanted["AGENTS.md"] =
    agents === undefined
      ? `# ${name}\n\n${instructions}\n`
      : written === undefined
        ? `${agents.trimEnd()}\n\n${instructions}\n`
        : written.text === instructions
          ? agents
          : `${agents.slice(0, written.start)}${instructions}${agents.slice(written.end)}`;

  const [claude] = CLAUDE_FILES;
  if (!CLAUDE_FILES.some((path) => bringsInAgents(path, existing(path) ?? ""))) {
    const own = existing(claude);
    wanted[claude] = own === undefined ? `${AGENTS_IMPORT}\n` : `${AGENTS_IMPORT}\n\n${own}`;
  }

  for (const registration of MCP_REGISTRATIONS) {
    const source = existing(registration.path);
    let file: Record<string, unknown> = {};
    if (source !== undefined) {
      try {
        const read = registeredEntry(registration, source);
        // Registered as this version registers it: the file stays as its author formatted it.
        if (isDeepStrictEqual(read.entry, registration.entry)) continue;
        file = read.file;
      } catch {
        unreadable.push(registration.path);
        continue;
      }
    }
    const servers = file[registration.servers];
    file[registration.servers] = {
      ...(typeof servers === "object" && servers !== null ? servers : {}),
      [AGENT_SERVER.name]: registration.entry,
    };
    wanted[registration.path] = `${JSON.stringify(file, null, 2)}\n`;
  }

  return {
    files: Object.fromEntries(
      Object.entries(wanted).filter(([path, contents]) => existing(path) !== contents),
    ),
    unreadable,
  };
}
