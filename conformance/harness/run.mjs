#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The conformance harness. It tests a server against the design from the outside, as any other
// server or a browser meets it, over HTTP and nothing else. For each fixture:
//
//   1. build and pack the packages, once, so what is installed is what a publish would ship;
//   2. create a project from the starter's tarball and lay the fixture's files over it;
//   3. install every @assemblejs package the starter wrote or the fixture names from its
//      tarball, never through a workspace link, and build with the command line the project
//      installed;
//   4. start dist/server.js under plain node, in production;
//   5. run the fixture's specs, conformance/specs/<fixture>/, with node's own test runner.
//
// A fixture is one project, its files at the fixture's root, or several under `projects`, each in
// its own directory, built and started in the order written. A project's `env` may name an
// earlier project's origin, or a port set aside under `ports`, as `{name}`. A spec reads the last
// project's origin as CONFORMANCE_ORIGIN, each by name as CONFORMANCE_ORIGIN_<NAME>, and each
// port as CONFORMANCE_PORT_<NAME>, for a server of its own that a project was told about. What
// each server writes is in a file a spec reads as CONFORMANCE_LOG (the last) or
// CONFORMANCE_LOG_<NAME>, so it can find a failure's correlation id where the server logged it.
// Each project's root is CONFORMANCE_ROOT (the last) or CONFORMANCE_ROOT_<NAME>, for a spec
// that runs the command line the project installed, or starts its build itself under another
// environment.
//
// An interrupt or a termination sent to the harness alone stops every server it started, and the
// specs, before it ends; one that arrives during a build is heard when that build returns.
//
// `pnpm conformance rendering` runs one fixture; no argument runs every one. It needs the network
// for the third-party dependencies, and minutes, so it runs on demand rather than inside
// `pnpm check`. It exits with the specs' result, and removes its working directory when every
// spec passed, keeping it to be read when one did not.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pack } from "./pack.mjs";
import { project as build } from "./project.mjs";
import { freePort, serve } from "./serve.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtures = join(here, "..", "fixtures");
const specs = join(here, "..", "specs");
const step = (text) => console.log(`\n== ${text}`);

const named = process.argv.slice(2);
const chosen = readdirSync(fixtures).filter(
  (name) =>
    existsSync(join(fixtures, name, "fixture.json")) &&
    (named.length === 0 || named.includes(name)),
);
const unknown = named.filter((name) => !chosen.includes(name));
if (unknown.length > 0 || chosen.length === 0) {
  console.error(`no such fixture: ${unknown.join(", ") || "(none found)"}`);
  process.exit(2);
}
/** A fixture's projects in the order they start, and the ports it sets aside. */
const read = (name) => {
  const fixture = JSON.parse(readFileSync(join(fixtures, name, "fixture.json"), "utf8"));
  const projects =
    fixture.projects === undefined
      ? [{ name: "app", dir: join(fixtures, name), packages: fixture.packages, env: {} }]
      : Object.entries(fixture.projects).map(([project, declared]) => ({
          name: project,
          dir: join(fixtures, name, project),
          packages: declared.packages,
          env: declared.env ?? {},
        }));
  return { projects, ports: fixture.ports ?? [] };
};
const declared = new Map(chosen.map((name) => [name, read(name)]));

const work = mkdtempSync(join(tmpdir(), "assemblejs-conformance-"));
// The servers running now, for a signal to stop before the harness goes.
const live = new Set();
for (const [signal, code] of [
  ["SIGINT", 130],
  ["SIGTERM", 143],
]) {
  process.once(signal, () => {
    console.error(`\nconformance: stopped by ${signal}; the projects are in ${work}`);
    void Promise.all([...live].map((server) => server.stop())).finally(() => process.exit(code));
  });
}

// The starter, what it writes into every project, and what the fixtures name beside them.
const packages = [
  ...new Set([
    "create",
    "core",
    "cli",
    "mcp",
    ...[...declared.values()].flatMap((fixture) =>
      fixture.projects.flatMap((project) => project.packages),
    ),
  ]),
];
step(`pack ${packages.join(", ")}`);
let tarball;
try {
  tarball = pack(packages, join(work, "tarballs"));
} catch (error) {
  // Nothing but tarballs is in the working directory yet, and nothing in it is worth reading.
  rmSync(work, { recursive: true, force: true });
  throw error;
}

/** Runs one fixture's specs against the servers built from it, answering whether all passed. */
const conform = async (name, fixture) => {
  const files = readdirSync(join(specs, name)).filter((file) => file.endsWith(".spec.mjs"));
  if (files.length === 0) throw new Error(`conformance/specs/${name}/ holds no spec`);
  // Every project is built before any port is set aside or any server started, so a port the
  // harness reserves is held for seconds, not for the minutes a build takes.
  const roots = fixture.projects.map((project) => {
    step(`${name}/${project.name}: create, install from the tarballs, and build`);
    return build(project.dir, join(work, name, project.name), tarball, project.packages);
  });
  const known = new Map();
  const env = {};
  for (const port of fixture.ports) {
    const value = await freePort();
    known.set(port, `http://127.0.0.1:${value}`);
    env[`CONFORMANCE_PORT_${port.toUpperCase()}`] = String(value);
  }
  const servers = [];
  try {
    for (const [index, project] of fixture.projects.entries()) {
      step(`${name}/${project.name}: start the built server`);
      const told = Object.fromEntries(
        Object.entries(project.env).map(([key, value]) => [
          key,
          value.replace(/\{([a-z-]+)\}/g, (_whole, named) => {
            const found = known.get(named);
            if (found === undefined) {
              throw new Error(
                `${project.name} names {${named}}, which no earlier project or port is`,
              );
            }
            return found;
          }),
        ]),
      );
      // Tracked from the moment it is spawned, so a signal while it starts stops it too.
      const server = await serve(roots[index], told, (spawned) => {
        servers.push(spawned);
        live.add(spawned);
      });
      console.log(server.origin);
      known.set(project.name, server.origin);
      env[`CONFORMANCE_ORIGIN_${project.name.toUpperCase()}`] = server.origin;
      env[`CONFORMANCE_LOG_${project.name.toUpperCase()}`] = server.log;
      env[`CONFORMANCE_ROOT_${project.name.toUpperCase()}`] = roots[index];
      env.CONFORMANCE_ORIGIN = server.origin;
      env.CONFORMANCE_LOG = server.log;
      env.CONFORMANCE_ROOT = roots[index];
    }
    step(`${name}: the specs`);
    // Run without blocking, so a signal to the harness is heard while the specs run.
    const specRun = spawn(
      process.execPath,
      ["--test", ...files.map((file) => join(specs, name, file))],
      { stdio: "inherit", env: { ...process.env, ...env } },
    );
    live.add({ stop: async () => void specRun.kill() });
    const status = await new Promise((resolve) => specRun.once("exit", resolve));
    return status === 0;
  } finally {
    await Promise.all(servers.map((server) => server.stop()));
    for (const server of servers) live.delete(server);
  }
};

const failed = [];
for (const [name, fixture] of declared) {
  try {
    if (!(await conform(name, fixture))) failed.push(name);
  } catch (error) {
    console.error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    failed.push(name);
  }
}

if (failed.length === 0) {
  rmSync(work, { recursive: true, force: true });
  console.log("\nconformance: every spec passed");
} else {
  console.log(`\nconformance: a spec failed in ${failed.join(", ")}; the projects are in ${work}`);
}
process.exit(failed.length === 0 ? 0 : 1);
