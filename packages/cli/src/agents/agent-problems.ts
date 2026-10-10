// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { outsideProblems } from "../root/outside-problems.js";
import { agentInstructions } from "./agent-instructions.js";
import { AGENT_SERVER } from "./agent-server.js";
import { AGENTS_IMPORT } from "./agents-import.js";
import { bringsInAgents } from "./brings-in-agents.js";
import { CLAUDE_FILES } from "./claude-files.js";
import { installedManifest } from "./installed-manifest.js";
import { instructionsIn } from "./instructions-in.js";
import { manifestOf } from "./manifest-of.js";
import { MCP_REGISTRATIONS } from "./mcp-registrations.js";
import { registeredEntry } from "./registered-entry.js";
import { textIn } from "./text-in.js";

const REWRITE =
  "run assemblejs add agents, which rewrites what this command line wrote and nothing else";
// A version, as a published package asks for the command line; not a range, nor a workspace's
// own way of naming it.
const EXACT = /^\d/;

/**
 * What is out of date in the agent files a project carries: the marked part of its `AGENTS.md`
 * where that is not what this version writes; a `CLAUDE.md` that hides those instructions from
 * Claude Code by not bringing `AGENTS.md` in; this project's server in a registration where it
 * is not registered as this version registers it; and a registered server the project does not
 * depend on.
 *
 * A project that carries none of them has nothing to hold. What it wrote of its own in any of
 * them is never judged, and neither is a registration this command line cannot read. And where
 * the agent surface a project installs is built on another command line than the one installed
 * beside it, that alone is reported: nothing is current to both.
 */
export function agentProblems(root: string): readonly ProjectProblem[] {
  const existing = textIn(root);
  // An agent file that leads out of the project is not read, and is treated as one the project
  // does not have; that it leads out is a finding of its own.
  const problems: ProjectProblem[] = [
    ...outsideProblems(
      root,
      [
        "AGENTS.md",
        ...CLAUDE_FILES,
        ...MCP_REGISTRATIONS.map(({ path }) => path),
        "package.json",
      ].map((path) => join(root, path)),
    ),
  ];
  const report = (path: string, message: string, fix = REWRITE): void => {
    problems.push({ path: join(root, path), rule: "agent-instructions-are-current", message, fix });
  };

  const written = instructionsIn(existing("AGENTS.md") ?? "");
  if (written !== undefined) {
    if (written.text !== agentInstructions()) {
      report(
        "AGENTS.md",
        "the agent instructions are not the ones this version of assemblejs writes",
      );
    }
    const claude = CLAUDE_FILES.filter((path) => existing(path) !== undefined);
    const [first] = claude;
    if (first !== undefined && !claude.some((path) => bringsInAgents(path, existing(path) ?? ""))) {
      report(
        first,
        `Claude Code reads this file in place of AGENTS.md, and it does not bring AGENTS.md in with ${AGENTS_IMPORT}`,
      );
    }
  }

  let registered = false;
  for (const registration of MCP_REGISTRATIONS) {
    let entry: unknown;
    try {
      entry = registeredEntry(registration, existing(registration.path) ?? "{}").entry;
    } catch {
      continue;
    }
    if (entry === undefined) continue;
    registered = true;
    if (!isDeepStrictEqual(entry, registration.entry)) {
      report(
        registration.path,
        `the server "${AGENT_SERVER.name}" is not registered the way this version of assemblejs registers it`,
      );
    }
  }
  if (
    registered &&
    !Object.hasOwn(manifestOf(existing("package.json")).dependencies, AGENT_SERVER.package)
  ) {
    report(
      "package.json",
      `the server "${AGENT_SERVER.name}" is registered, and the project does not depend on ${AGENT_SERVER.package}, which carries it`,
      `npm install --save-dev ${AGENT_SERVER.package}`,
    );
  }

  // What is current is one version's to say. The agent surface is built on one exact version of
  // the command line; where the project installs another beside it, the two write and check
  // different instructions, and no rewriting of them satisfies both. That is the one thing to
  // put right, so it is the one thing reported.
  const builtOn = installedManifest(root, AGENT_SERVER.package).dependencies[
    AGENT_SERVER.commandLine
  ];
  const beside = installedManifest(root, AGENT_SERVER.commandLine).version;
  if (
    (written !== undefined || registered) &&
    builtOn !== undefined &&
    beside !== undefined &&
    EXACT.test(builtOn) &&
    builtOn !== beside
  ) {
    return [
      {
        path: join(root, "package.json"),
        rule: "agent-instructions-are-current",
        message: `the ${AGENT_SERVER.package} this project installs is built on ${AGENT_SERVER.commandLine} ${builtOn}, and the project installs ${beside}: each writes and checks its own agent instructions`,
        fix: `bring the two to versions released together: npm update ${AGENT_SERVER.commandLine} ${AGENT_SERVER.package}`,
      },
    ];
  }
  return problems;
}
