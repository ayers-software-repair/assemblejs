// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// What every spec shares: the server under test, and reading its answers as the contract
// describes them.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { freePort } from "../harness/serve.mjs";
export const origin = process.env.CONFORMANCE_ORIGIN ?? "";
if (origin === "") throw new Error("CONFORMANCE_ORIGIN names the server under test");

export const get = (path, headers = {}) => fetch(new URL(path, origin), { headers });

/** In a fixture of several servers, one of them by its project's name; `origin` is the last. */
export const originOf = (name) => {
  const named = process.env[`CONFORMANCE_ORIGIN_${name.toUpperCase()}`] ?? "";
  if (named === "") throw new Error(`no server named ${name} in this fixture`);
  return named;
};

/**
 * Whether the server logged a failure against this correlation id (DESIGN 12), read from what
 * it wrote, waiting a moment for a line still on its way to the file.
 */
export const logged = async (correlationId, name) => {
  const file =
    process.env[name === undefined ? "CONFORMANCE_LOG" : `CONFORMANCE_LOG_${name.toUpperCase()}`];
  if (file === undefined) throw new Error("no server log in this run");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const lines = readFileSync(file, "utf8").split("\n");
    const found = lines.some((line) => {
      try {
        return JSON.parse(line).correlationId === correlationId;
      } catch {
        return false;
      }
    });
    if (found) return true;
    await sleep(100);
  }
  return false;
};

/**
 * A project's root, by its name, where the command line it installed runs and its build is; the
 * last project's when no name is given.
 */
export const rootOf = (name) => {
  const root =
    process.env[name === undefined ? "CONFORMANCE_ROOT" : `CONFORMANCE_ROOT_${name.toUpperCase()}`];
  if (root === undefined || root === "") throw new Error(`no project named ${name ?? "(last)"}`);
  return root;
};

/**
 * A project's build, started by the spec itself under an environment of its own, on a port the
 * system gives: its origin once it listens, or undefined for a server that would not, with its
 * exit code and everything it wrote. One that has not listened within 30s is stopped, so a spec
 * waiting on its exit never hangs. The spec stops it before it ends.
 */
export const started = async (root, env, attempts = 3) => {
  const port = String(await freePort());
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: root,
    env: { ...process.env, ...env, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += String(chunk)));
  child.stderr.on("data", (chunk) => (output += String(chunk)));
  // Settled once the process has gone and its output is all read: "close", not "exit", as the
  // streams may still carry the last of what it wrote when it exits.
  const closed = new Promise((resolve) => child.once("close", resolve));
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await closed;
  };
  const origin = await new Promise((resolve) => {
    const timer = setTimeout(() => void stop().then(() => resolve(undefined)), 30_000);
    child.stdout.on("data", (chunk) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found) {
        clearTimeout(timer);
        resolve(found[1]);
      }
    });
    void closed.then(() => {
      clearTimeout(timer);
      resolve(undefined);
    });
  });
  // Spec files run at once, and two can draw the same free port in the moment between the probe
  // and the listen; a port found taken is tried again on another.
  if (origin === undefined && attempts > 1 && output.includes("EADDRINUSE")) {
    return started(root, env, attempts - 1);
  }
  return { origin, exit: () => closed, output: () => output, stop };
};

/** A port the harness set aside, by name, for a spec to listen on itself. */
export const portOf = (name) => {
  const port = Number(process.env[`CONFORMANCE_PORT_${name.toUpperCase()}`] ?? "");
  if (!Number.isInteger(port) || port <= 0) throw new Error(`no port named ${name}`);
  return port;
};

// Every attribute of an opening tag, a valueless one too, which reads as the empty string.
const ATTRIBUTE = /\s([^\s=/>"']+)(?:="([^"]*)")?/g;
const readAttributes = (source) =>
  Object.fromEntries([...source.matchAll(ATTRIBUTE)].map((match) => [match[1], match[2] ?? ""]));

/** The envelope's opening tag's attributes, by name. */
export const attributesOf = (fragment) => {
  const open = /^<assembly-root\b([^>]*)>/.exec(fragment.trim());
  if (open === null) throw new Error(`no envelope: ${fragment.slice(0, 80)}`);
  return readAttributes(open[1]);
};

/** Every envelope in a page, in document order, with its attributes and what it holds. */
export const envelopesOf = (page) =>
  [...page.matchAll(/<assembly-root\b([^>]*)>([\s\S]*?)<\/assembly-root>/g)].map((match) => ({
    attributes: readAttributes(match[1]),
    inner: match[2],
  }));

/**
 * Every envelope in a page as a tree, in document order: each with its attributes and the
 * envelopes that stand inside it, which is how an assembly holds the ones its view places.
 */
export const treeOf = (page) => {
  const roots = [];
  const open = [];
  for (const tag of page.matchAll(/<(\/?)assembly-root\b([^>]*)>/g)) {
    if (tag[1] === "/") {
      open.pop();
      continue;
    }
    const envelope = { attributes: readAttributes(tag[2]), children: [] };
    (open.at(-1)?.children ?? roots).push(envelope);
    open.push(envelope);
  }
  return roots;
};

/** The data island inside an envelope, parsed. */
export const islandOf = (fragment) => {
  const script =
    /<script type="application\/json" data-assembly="([^"]+)">([\s\S]*?)<\/script>/.exec(fragment);
  if (script === null) throw new Error("no data island");
  return { id: script[1], payload: JSON.parse(script[2]) };
};
