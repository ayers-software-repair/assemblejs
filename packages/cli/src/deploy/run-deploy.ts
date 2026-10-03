// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildProject } from "../build/build-project.js";
import type { Io } from "../io/io.js";
import { deployPackage } from "./deploy-package.js";

/**
 * The `deploy` verb: builds the project, then writes `deploy/`, a directory that runs anywhere
 * Node does: the build's `dist/` and a package.json of the project's dependencies alone. Install
 * its dependencies there and `npm start` runs the same `node dist/server.js` that `dev` and
 * `build` run. It is written whole each time, so nothing an earlier deploy wrote outlives it.
 * It publishes nothing and touches no remote: where the directory goes is the author's.
 */
export async function runDeploy(
  root: string,
  io: Io,
  build: (root: string, io: Io) => Promise<number> = buildProject,
): Promise<number> {
  const manifest = join(root, "package.json");
  if (!existsSync(manifest)) {
    io.error("there is no package.json here to deploy; run deploy from a project's root");
    return 1;
  }
  if ((await build(root, io)) !== 0) return 1;
  const out = join(root, "deploy");
  rmSync(out, { recursive: true, force: true });
  cpSync(join(root, "dist"), join(out, "dist"), { recursive: true });
  const project = JSON.parse(readFileSync(manifest, "utf8")) as Record<string, unknown>;
  io.write(join(out, "package.json"), `${JSON.stringify(deployPackage(project), null, 2)}\n`);
  io.log("wrote deploy/: install its dependencies there, then npm start");
  return 0;
}
