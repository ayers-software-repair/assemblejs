// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildProject } from "../build/build-project.js";
import type { Io } from "../io/io.js";
import { deployPackage } from "./deploy-package.js";
import { deployProblems } from "./deploy-problems.js";
import { serverImports } from "./server-imports.js";

// Written into every deploy, so a later deploy rewrites only a directory a deploy wrote.
const MARKER = ".assemblejs-deploy";

/**
 * The `deploy` verb: builds the project, then writes `deploy/`, a directory that runs anywhere
 * Node does: the build's `dist/` and a package.json of the project's dependencies alone. Install
 * its dependencies there and `npm start` runs the same `node dist/server.js` that `dev` and
 * `build` run.
 *
 * Refused before anything is written: a package.json that is not an object, a `deploy/` that a
 * deploy did not write (it is rewritten whole, and a directory of the author's is never removed),
 * and a package the server imports that the deploy could not install. It publishes nothing and
 * touches no remote: where the directory goes is the author's.
 */
export async function runDeploy(
  root: string,
  io: Io,
  build: (root: string, io: Io) => Promise<number> = buildProject,
): Promise<number> {
  const out = join(root, "deploy");
  let project: unknown;
  try {
    project = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  } catch (error) {
    io.error(
      `there is no package.json here that can be read: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
  if (typeof project !== "object" || project === null || Array.isArray(project)) {
    io.error("package.json is not an object");
    return 1;
  }
  if (existsSync(out) && !existsSync(join(out, MARKER))) {
    io.error("deploy/ is here and a deploy did not write it: move it, and deploy writes its own");
    return 1;
  }
  if ((await build(root, io)) !== 0) return 1;
  const manifest = project as Record<string, unknown>;
  const imports = serverImports(readFileSync(join(root, "dist", "server.js"), "utf8"));
  const problems = deployProblems(imports, manifest);
  if (problems.length > 0) {
    for (const problem of problems) io.error(problem);
    return 1;
  }
  rmSync(out, { recursive: true, force: true });
  cpSync(join(root, "dist"), join(out, "dist"), { recursive: true });
  io.write(
    join(out, "package.json"),
    `${JSON.stringify(deployPackage(manifest, root, out), null, 2)}\n`,
  );
  io.write(join(out, MARKER), "written by assemblejs deploy, and rewritten whole by the next\n");
  io.log("wrote deploy/: install its dependencies there, then npm start");
  return 0;
}
