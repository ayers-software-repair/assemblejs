// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ATTRIBUTE, ENVELOPE_ELEMENT } from "@assemblejs/core";
import type { AssetWeight } from "./asset-weight.js";
import type { PageWeight } from "./page-weight.js";
import { readTags } from "./read-tags.js";
import { staticImports } from "./static-imports.js";
import { weigh } from "./weigh.js";

// How long one request may take before the page is a failure rather than a wait.
const TIMEOUT_MS = 30_000;
// The script types a browser runs: none at all, a JavaScript type, or a module.
const RUNS = /^$|^module$|^(text|application)\/(x-)?(javascript|ecmascript)$/i;

const sum = (weights: readonly AssetWeight[]): AssetWeight => ({
  bytes: weights.reduce((total, weight) => total + weight.bytes, 0),
  gzip: weights.reduce((total, weight) => total + weight.gzip, 0),
});

/**
 * Asks a running server for a page as a visitor's browser would, then for each stylesheet and
 * script the page links from its own origin, each once, and weighs what came back: a script the
 * browser runs, classic or module, and one it is told to load ahead as a module. And for what
 * each module among them imports before it runs, and what those import, each once: a browser
 * loads all of it before anything mounts, and a build that splits its code puts most of a
 * page's script there. What a module asks for later, with `import()`, is loaded when something
 * mounts, and is not weighed. A file from another origin is named, never fetched: measuring
 * touches no other server. Anything not answered with 200 in time is a failure, never a weight
 * of nothing; `signal` abandons a request in flight.
 *
 * It asks as a visitor who has not signed in, so a page the server refuses such a visitor, with
 * a 401 or a 403, has no weight for one and is answered as undefined: the project guards it,
 * which is no failure of the page. A file an open page links is not let off the same way.
 */
export async function measurePage(
  origin: string,
  route: string,
  signal?: AbortSignal,
): Promise<PageWeight | undefined> {
  const own = new URL(origin).origin;
  const ask = (url: URL): Promise<Response> => {
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    return fetch(url, {
      signal: signal === undefined ? timeout : AbortSignal.any([timeout, signal]),
    });
  };
  const read = async (url: URL, response: Response): Promise<Uint8Array> => {
    if (response.status !== 200) throw new Error(`${url.pathname} answered ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  };
  const get = async (url: URL): Promise<Uint8Array> => read(url, await ask(url));
  const address = new URL(route, own);
  const answer = await ask(address);
  if (answer.status === 401 || answer.status === 403) {
    await answer.body?.cancel();
    return undefined;
  }
  const page = await read(address, answer);
  const tags = readTags(new TextDecoder().decode(page));
  const elsewhere: string[] = [];
  const linked = async (urls: readonly string[]): Promise<AssetWeight> => {
    const local = new Map<string, URL>();
    for (const url of urls) {
      const resolved = new URL(url, own);
      if (resolved.origin === own) local.set(resolved.href, resolved);
      else elsewhere.push(resolved.href);
    }
    return sum(await Promise.all([...local.values()].map(async (url) => weigh(await get(url)))));
  };
  const linkedAs = (rel: string): string[] =>
    tags
      .filter(
        ({ tag, attributes }) =>
          tag === "link" && (attributes["rel"] ?? "").toLowerCase().split(/\s+/).includes(rel),
      )
      .map(({ attributes }) => attributes["href"] ?? "")
      .filter((href) => href !== "");
  const styles = await linked(linkedAs("stylesheet"));
  // Each script the page links, and whether the browser reads it as a module, which is what
  // decides whether it may import.
  const scripts: Array<readonly [url: URL, module: boolean]> = [
    ...tags
      // A browser that runs modules skips a script marked `nomodule`.
      .filter(
        ({ tag, attributes }) =>
          tag === "script" && RUNS.test(attributes["type"] ?? "") && !("nomodule" in attributes),
      )
      .filter(({ attributes }) => (attributes["src"] ?? "") !== "")
      .map(
        ({ attributes }) =>
          [
            new URL(attributes["src"] ?? "", own),
            (attributes["type"] ?? "").toLowerCase() === "module",
          ] as const,
      ),
    ...linkedAs("modulepreload").map((href) => [new URL(href, own), true] as const),
  ];
  // Every script loaded before anything mounts, each once: the ones the page links, and what
  // each module among them imports before it runs, and what those import, to the end.
  const weighed = new Map<string, AssetWeight>();
  const followed = new Set<string>();
  while (scripts.length > 0) {
    const [url, module] = scripts.shift() ?? [address, false];
    if (url.origin !== own) {
      elsewhere.push(url.href);
      continue;
    }
    if (weighed.has(url.href) && (!module || followed.has(url.href))) continue;
    const body = await get(url);
    weighed.set(url.href, weigh(body));
    if (!module) continue;
    followed.add(url.href);
    for (const specifier of staticImports(new TextDecoder().decode(body))) {
      // A browser resolves only these against the module; any other is one it refuses.
      if (!/^(\.{0,2}\/|[a-z][a-z0-9+.-]*:)/i.test(specifier)) continue;
      scripts.push([new URL(specifier, url), true]);
    }
  }
  return {
    route,
    document: weigh(page),
    styles,
    scripts: sum([...weighed.values()]),
    elsewhere: [...new Set(elsewhere)],
    fellBack: tags
      .filter(
        ({ tag, attributes }) =>
          tag === ENVELOPE_ELEMENT && ENVELOPE_ATTRIBUTE.failed in attributes,
      )
      .map(({ attributes }) => attributes[ENVELOPE_ATTRIBUTE.name] ?? ""),
  };
}
