// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// What every spec shares: the server under test, and reading its answers as the contract
// describes them.
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
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

/** The data island inside an envelope, parsed. */
export const islandOf = (fragment) => {
  const script =
    /<script type="application\/json" data-assembly="([^"]+)">([\s\S]*?)<\/script>/.exec(fragment);
  if (script === null) throw new Error("no data island");
  return { id: script[1], payload: JSON.parse(script[2]) };
};
