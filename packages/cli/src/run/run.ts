// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import { buildProject } from "@assemblejs/build";
import { ownVersion } from "@assemblejs/build";
import { runDev } from "@assemblejs/build";
import { RENDERERS } from "@assemblejs/build";
import type { Io } from "@assemblejs/build";
import { runCheck } from "@assemblejs/check";
import { runPerf } from "@assemblejs/check";
import { addAgents } from "../commands/add-agents.js";
import { addAssembly } from "../commands/add-assembly.js";
import { newProject } from "../commands/new-project.js";
import { runDeploy } from "../deploy/run-deploy.js";
import { readArguments } from "./read-arguments.js";

const USAGE = `assemblejs <command>

  new <directory>              scaffold a project that runs; . is the directory you are in
  add assembly <name> [--renderer <name>]
                               add an assembly; a directory IS an assembly
  add agents                   write the agent instructions and MCP registrations, or bring
                               the ones the project has up to date
  dev                          build, run, and rebuild on every change
  build                        build dist/server.js and its browser files
  check                        report every problem found without building
  perf                         build, then weigh what each page sends a visitor
  deploy                       build, then write deploy/: dist and its dependencies

  --renderer   one of: ${RENDERERS.join(", ")}   (default html)
  --cwd        where to work (default: here)
  --version    say which version this is, and stop
  --help       say this, and stop`;

/**
 * The whole command line, as a function of its arguments and its io.
 *
 * NON-INTERACTIVE BY CONSTRUCTION: there is no prompt anywhere in here, so there is no
 * behaviour that differs between a terminal and a pipe. A tool that asks questions when it has
 * a terminal is a tool that hangs in CI on the day someone forgets a flag.
 *
 * Returns the exit code rather than calling process.exit, so the tests drive the real command. A
 * command that waits on the bundler returns it as a promise.
 */
export function run(argv: readonly string[], io: Io): number | Promise<number> {
  const { flags, positional, problem } = readArguments(argv);
  if (problem !== undefined) {
    io.error(problem);
    io.error(USAGE);
    return 2;
  }
  const cwd = flags.get("cwd") ?? ".";
  const [command, ...rest] = positional;

  if (flags.has("version")) {
    io.log(ownVersion(import.meta.url));
    return 0;
  }
  if (command === undefined || command === "help" || flags.has("help")) {
    io.log(USAGE);
    return command === undefined ? 2 : 0;
  }

  if (command === "new") return newProject(rest[0], cwd, io);
  if (command === "add" && rest[0] === "agents") return addAgents(resolve(cwd), io);
  if (command === "add") return add(rest, flags.get("renderer") ?? "html", cwd, io);
  if (command === "build") return buildProject(resolve(cwd), io);
  if (command === "dev") return runDev(resolve(cwd), io, interrupted());
  if (command === "check") return runCheck(resolve(cwd), io);
  if (command === "perf") return runPerf(resolve(cwd), io, { signal: interrupted() });
  if (command === "deploy") return runDeploy(resolve(cwd), io);

  io.error(`unknown command "${command}"`);
  io.error(USAGE);
  return 2;
}

function add(rest: readonly string[], renderer: string, cwd: string, io: Io): number {
  const [what, name] = rest;
  if (what !== "assembly") {
    io.error(`add what? try: assemblejs add assembly <name>, or assemblejs add agents`);
    return 2;
  }
  if (name === undefined || name === "") {
    io.error("add assembly needs a name: assemblejs add assembly <name>");
    return 2;
  }
  return addAssembly(name, renderer, cwd, io);
}

/**
 * Aborts on Ctrl-C, a supervisor's stop or a closed terminal, so a long-running command can end
 * cleanly. A second
 * one ends the process at once, through `exit`, so what it started is still stopped on the way.
 */
function interrupted(): AbortSignal {
  const controller = new AbortController();
  for (const name of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(name, () => {
      if (controller.signal.aborted) process.exit(130);
      controller.abort();
    });
  }
  return controller.signal;
}
