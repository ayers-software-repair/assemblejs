// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename, join } from "node:path";
import type { Io } from "@assemblejs/build";
import { outsideProblems } from "@assemblejs/build";
import { agentFiles } from "@assemblejs/check";
import { AGENT_SERVER } from "@assemblejs/check";
import { cannotRegister } from "@assemblejs/check";
import { manifestOf } from "@assemblejs/check";
import { textIn } from "@assemblejs/check";
import { noProject } from "./no-project.js";

/**
 * The `add agents` command: gives a project the agent instructions and registrations a new one
 * is written with, or brings the ones it has up to date, and says which files it wrote. A
 * registration it cannot read, or a file that leads out of the project, stops it before
 * anything is written, so a project is never left with some of its agent files rewritten and
 * one not. A directory with no `package.json` is no project, and nothing is written there.
 */
export function addAgents(root: string, io: Io): number {
  const existing = textIn(root);
  if (existing("package.json") === undefined) {
    io.error(noProject(root));
    return 1;
  }
  const manifest = manifestOf(existing("package.json"));
  const { files, unreadable } = agentFiles(manifest.name ?? basename(root), existing);
  if (unreadable.length > 0) {
    for (const path of unreadable) {
      io.error(`${cannotRegister(path)}: correct it or remove it, then run this again`);
    }
    return 1;
  }
  // Nothing is written through a link that leads out of the project: what stands there is not
  // this project's to rewrite, and was not read to be brought up to date.
  const leading = outsideProblems(
    root,
    Object.keys(files).map((path) => join(root, path)),
  );
  if (leading.length > 0) {
    for (const problem of leading) io.error(`${problem.message}: ${problem.fix}`);
    return 1;
  }
  for (const [path, contents] of Object.entries(files)) {
    io.write(join(root, path), contents);
    io.log(`wrote ${path}`);
  }
  if (Object.keys(files).length === 0) {
    io.log("the agent instructions and registrations are current");
  }
  if (!Object.hasOwn(manifest.dependencies, AGENT_SERVER.package)) {
    io.log(`\ninstall the server they register: npm install --save-dev ${AGENT_SERVER.package}`);
  }
  return 0;
}
