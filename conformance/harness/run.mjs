#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The conformance harness. It tests a server against the assembly contract (DESIGN 2) from the
// outside, as any other server or a browser meets it, over HTTP and nothing else:
//
//   1. build and pack the packages, so what is installed is what a publish would ship;
//   2. create a project from the starter's tarball and lay the fixture's files over it;
//   3. install every @assemblejs package from its tarball, never through a workspace link, and
//      build with the command line the project installed;
//   4. start dist/server.js under plain node, in production;
//   5. run every spec in conformance/specs against it with node's own test runner.
//
// It needs the network for the third-party dependencies, and minutes, so it runs on demand
// (`pnpm conformance`) rather than inside `pnpm check`. It exits with the specs' result.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pack } from "./pack.mjs";
import { project } from "./project.mjs";
import { serve } from "./serve.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const step = (text) => console.log(`\n== ${text}`);

const work = mkdtempSync(join(tmpdir(), "assemblejs-conformance-"));
step("pack core, cli and create");
const tarball = pack(["core", "cli", "create"], join(work, "tarballs"));
step("create, install from the tarballs, and build the contract fixture");
const root = project(join(here, "..", "fixtures", "contract"), work, tarball, ["core", "cli"]);
step("start the built server");
const server = await serve(root);
console.log(server.origin);

step("the specs");
const specs = join(here, "..", "specs");
let status;
try {
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      ...readdirSync(specs)
        .filter((file) => file.endsWith(".spec.mjs"))
        .map((file) => join(specs, file)),
    ],
    { stdio: "inherit", env: { ...process.env, CONFORMANCE_ORIGIN: server.origin } },
  );
  status = result.status ?? 1;
} finally {
  server.stop();
}
console.log(status === 0 ? "\nconformance: every spec passed" : "\nconformance: a spec failed");
process.exit(status);
