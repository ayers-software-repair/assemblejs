// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join, resolve } from "node:path";
import { buildProject } from "../build/build-project.js";
import { planAssembly } from "../commands/plan-assembly.js";
import { projectFiles } from "../commands/project-files.js";
import { RENDERERS } from "../commands/renderers.js";
import { runDev } from "../dev/run-dev.js";
import type { Io } from "../io/io.js";

const USAGE = `assemblejs <command>

  new <directory>              scaffold a project that runs
  add assembly <name> [--renderer <name>]
                               add an assembly; a directory IS an assembly
  dev                          build, run, and rebuild on every change
  build                        build dist/server.js and its browser files

  --renderer   one of: ${RENDERERS.join(", ")}   (default html)
  --cwd        where to work (default: here)`;

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
  if (command === "add") return addAssembly(rest, flags.get("renderer") ?? "html", cwd, io);
  if (command === "build") return buildProject(resolve(cwd), io);
  if (command === "dev") return runDev(resolve(cwd), io, interrupted());

  io.error(`unknown command "${command}"`);
  io.error(USAGE);
  return 2;
}

function newProject(directory: string | undefined, cwd: string, io: Io): number {
  if (directory === undefined || directory === "") {
    io.error("new needs a directory: assemblejs new my-app");
    return 2;
  }
  const root = join(cwd, directory);
  if (io.exists(root)) {
    io.error(`${directory} already exists`);
    return 1;
  }
  for (const [path, contents] of Object.entries(projectFiles(directory))) {
    io.write(join(root, path), contents);
    io.log(`wrote ${join(directory, path)}`);
  }
  io.log(`\n  cd ${directory}\n  pnpm install\n  pnpm dev`);
  return 0;
}

function addAssembly(rest: readonly string[], renderer: string, cwd: string, io: Io): number {
  const [what, name] = rest;
  if (what !== "assembly") {
    io.error(`add what? try: assemblejs add assembly <name>`);
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

/** Aborts on Ctrl-C or a supervisor's stop, so a long-running command can end cleanly. */
function interrupted(): AbortSignal {
  const controller = new AbortController();
  for (const name of ["SIGINT", "SIGTERM"] as const) {
    process.once(name, () => controller.abort());
  }
  return controller.signal;
}
