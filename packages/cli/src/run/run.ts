// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { assemblyFiles } from "../commands/assembly-files.js";
import { projectFiles } from "../commands/project-files.js";
import { RENDERERS } from "../commands/renderers.js";
import { discoverAssemblies } from "../discovery/discover-assemblies.js";
import { generateRegistry } from "../generate/generate-registry.js";
import type { Io } from "../io/io.js";

const USAGE = `assemblejs <command>

  new <directory>              scaffold a project that runs
  add assembly <name> [--renderer <name>]
                               add an assembly; a directory IS an assembly
  generate                     rewrite the module the built server imports

  --renderer   one of: ${RENDERERS.join(", ")}   (default html)
  --cwd        where to work (default: here)`;

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * The whole command line, as a function of its arguments and its io.
 *
 * NON-INTERACTIVE BY CONSTRUCTION: there is no prompt anywhere in here, so there is no
 * behaviour that differs between a terminal and a pipe. A tool that asks questions when it has
 * a terminal is a tool that hangs in CI on the day someone forgets a flag.
 *
 * Returns the exit code rather than calling process.exit, so the tests drive the real command.
 */
export function run(argv: readonly string[], io: Io): number {
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
  if (command === "generate") return generate(cwd, io);

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
  if (name === undefined || !NAME.test(name)) {
    io.error(`"${name ?? ""}" is not a usable assembly name; lower case, starting with a letter`);
    return 2;
  }
  if (!RENDERERS.includes(renderer)) {
    io.error(`unknown renderer "${renderer}"; one of: ${RENDERERS.join(", ")}`);
    return 2;
  }
  const files = assemblyFiles(name, renderer);
  if (files === undefined) {
    io.error(`unknown renderer "${renderer}"`);
    return 2;
  }
  if (io.exists(join(cwd, "src", "assemblies", name))) {
    io.error(`assembly "${name}" already exists`);
    return 1;
  }
  for (const [path, contents] of Object.entries(files)) {
    io.write(join(cwd, path), contents);
    io.log(`wrote ${path}`);
  }
  // The one thing that is NOT written: the author's own server file. It never grows.
  io.log(`\nadd it to a page with <assembly name="${name}"></assembly>`);
  return 0;
}

function generate(cwd: string, io: Io): number {
  const { assemblies, problems } = discoverAssemblies(join(cwd, "src", "assemblies"));
  for (const problem of problems) io.error(problem);
  if (problems.length > 0) return 1;
  io.write(join(cwd, ".assemblejs", "assemblies.ts"), generateRegistry(assemblies));
  io.log(`generated .assemblejs/assemblies.ts for ${assemblies.length} assembly(s)`);
  return 0;
}
