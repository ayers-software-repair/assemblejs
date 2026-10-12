// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join, resolve } from "node:path";
import type { Io } from "../io/io.js";
import { insideRoot } from "../root/inside-root.js";
import { OutsideRootError } from "../root/outside-root-error.js";
import { noProject } from "./no-project.js";
import { planAssembly } from "./plan-assembly.js";

/**
 * Adds an assembly to the project at a directory, and answers the command's exit code: what
 * was written and the tag that places it, or the one problem and its fix.
 *
 * Only into a project, and only inside it. A directory with no `package.json` is not one, so a
 * mistyped `--cwd` writes nothing; and every path is asked of the root guard before it is
 * written, as the agent surface's are, so a link under `src` carries nothing out of the project
 * and one that leads nowhere is said to, in a line.
 */
export function addAssembly(name: string, renderer: string, cwd: string, io: Io): number {
  if (!io.exists(join(cwd, "package.json"))) {
    io.error(noProject(cwd));
    return 1;
  }
  const plan = planAssembly(name, renderer, io.exists(join(cwd, "src", "assemblies", name)));
  if ("problem" in plan) {
    io.error(`${plan.problem.message}: ${plan.problem.fix}`);
    return plan.usage ? 2 : 1;
  }
  const files = Object.entries(plan.files);
  try {
    for (const [path] of files) insideRoot(resolve(cwd), resolve(cwd, path));
  } catch (error) {
    if (!(error instanceof OutsideRootError)) throw error;
    const asked = `src/assemblies/${name}`;
    io.error(
      error.message.includes("leads nowhere")
        ? `${asked} is beneath a link that leads nowhere: remove the link, or make what it names`
        : `${asked} leads out of the project, and nothing is written outside it: put the directory itself where the link is`,
    );
    return 1;
  }
  for (const [path, contents] of files) {
    io.write(join(cwd, path), contents);
    io.log(`wrote ${path}`);
  }
  // The one thing that is NOT written: the author's own server file. It never grows.
  io.log(`\nadd it to a page with ${plan.tag}`);
  return 0;
}
