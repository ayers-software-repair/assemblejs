// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename, join, resolve } from "node:path";
import { addAgents } from "../agents/add-agents.js";
import { buildProject } from "../build/build-project.js";
import { runCheck } from "../check/run-check.js";
import { planAssembly } from "../commands/plan-assembly.js";
import { projectFiles } from "../commands/project-files.js";
import { RENDERERS } from "../commands/renderers.js";
import { runDeploy } from "../deploy/run-deploy.js";
import { runDev } from "../dev/run-dev.js";
import { suggestName } from "../discovery/suggest-name.js";
import type { Io } from "../io/io.js";
import { runPerf } from "../perf/run-perf.js";

const USAGE = `assemblejs <command>

  new <directory>              scaffold a project that runs
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
  --cwd        where to work (default: here)`;

const PACKAGE = /^[a-z][a-z0-9-]*$/;

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
  const flags = new Map<string, string>();
  const positional: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    if (argument.startsWith("--")) {
      flags.set(argument.slice(2), argv[index + 1] ?? "");
      index += 1;
    } else positional.push(argument);
  }
  const cwd = flags.get("cwd") ?? ".";
  const [command, ...rest] = positional;

  if (command === undefined || command === "help" || flags.has("help")) {
    io.log(USAGE);
    return command === undefined ? 2 : 0;
  }

  if (command === "new") return newProject(rest[0], cwd, io);
  if (command === "add" && rest[0] === "agents") return addAgents(resolve(cwd), io);
  if (command === "add") return addAssembly(rest, flags.get("renderer") ?? "html", cwd, io);
  if (command === "build") return buildProject(resolve(cwd), io);
  if (command === "dev") return runDev(resolve(cwd), io, interrupted());
  if (command === "check") return runCheck(resolve(cwd), io);
  if (command === "perf") return runPerf(resolve(cwd), io, { signal: interrupted() });
  if (command === "deploy") return runDeploy(resolve(cwd), io);

  io.error(`unknown command "${command}"`);
  io.error(USAGE);
  return 2;
}

function newProject(directory: string | undefined, cwd: string, io: Io): number {
  if (directory === undefined || directory === "") {
    io.error("new needs a directory: assemblejs new my-app");
    return 2;
  }
  const name = basename(directory);
  if (!PACKAGE.test(name)) {
    io.error(`"${name}" cannot name a package; lower case with hyphens: try ${suggestName(name)}`);
    return 2;
  }
  const root = join(cwd, directory);
  if (io.exists(root)) {
    io.error(`${directory} already exists`);
    return 1;
  }
  for (const [path, contents] of Object.entries(projectFiles(name))) {
    io.write(join(root, path), contents);
    io.log(`wrote ${join(directory, path)}`);
  }
  const manager = (process.env["npm_config_user_agent"] ?? "npm").split("/")[0] ?? "npm";
  io.log(`\n  cd ${directory}\n  ${manager} install\n  ${manager} run dev`);
  return 0;
}

function addAssembly(rest: readonly string[], renderer: string, cwd: string, io: Io): number {
  const [what, name] = rest;
  if (what !== "assembly") {
    io.error(`add what? try: assemblejs add assembly <name>, or assemblejs add agents`);
    return 2;
  }
  const plan = planAssembly(
    name ?? "",
    renderer,
    io.exists(join(cwd, "src", "assemblies", name ?? "")),
  );
  if ("problem" in plan) {
    io.error(`${plan.problem.message}: ${plan.problem.fix}`);
    return plan.usage ? 2 : 1;
  }
  for (const [path, contents] of Object.entries(plan.files)) {
    io.write(join(cwd, path), contents);
    io.log(`wrote ${path}`);
  }
  // The one thing that is NOT written: the author's own server file. It never grows.
  io.log(`\nadd it to a page with ${plan.tag}`);
  return 0;
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
