// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ATTRIBUTE, ENVELOPE_ELEMENT } from "@assemblejs/core";
import type { AssetWeight } from "./asset-weight.js";
import { lazyModules } from "./lazy-modules.js";
import { mountsInTheBrowser } from "./mounts-in-the-browser.js";
import type { PageWeight } from "./page-weight.js";
import { readTags } from "./read-tags.js";
import { staticImports } from "./static-imports.js";
import { weigh } from "./weigh.js";

// How long one request may take before the page is a failure rather than a wait.
const TIMEOUT_MS = 30_000;
// The script types a browser runs: none at all, a JavaScript type, or a module.
const RUNS = /^$|^module$|^(text|application)\/(x-)?(javascript|ecmascript)$/i;
// The specifiers a browser resolves against the module; any other is one it refuses.
const RESOLVES = /^(\.{0,2}\/|[a-z][a-z0-9+.-]*:)/i;

const sum = (weights: readonly AssetWeight[]): AssetWeight => ({
  bytes: weights.reduce((total, weight) => total + weight.bytes, 0),
  gzip: weights.reduce((total, weight) => total + weight.gzip, 0),
});

/**
 * Asks a running server for a page as a visitor's browser would, then for each stylesheet and
 * script the page links from its own origin, each once, and weighs what came back: a script the
 * browser runs, classic or module, and one it is told to load ahead as a module. And for what
 * each module among them imports before it runs, and what those import, each once: a browser
 * loads all of it before anything mounts. Then, apart, the module of each assembly the browser
 * mounts on the page, with what it imports, each file once across the page. A file from
 * another origin is named, never fetched: measuring touches no other server. Anything not
 * answered with 200 in time is a failure, never a weight of nothing; `signal` abandons a request
 * in flight. A route with a parameter is weighed at `address`.
 *
 * It asks as a visitor who has not signed in, so a page the server refuses such a visitor, with
 * a 401 or a 403, has no weight for one and is answered as undefined: the project guards it,
 * which is no failure of the page. A file an open page links is not let off the same way.
 */
export async function measurePage(
  origin: string,
  route: string,
  signal?: AbortSignal,
  address?: string,
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
  const target = new URL(address ?? route, own);
  if (target.origin !== own) throw new Error(`${address ?? route} leads to another origin`);
  const answer = await ask(target);
  if (answer.status === 401 || answer.status === 403) {
    await answer.body?.cancel();
    return undefined;
  }
  const page = await read(target, answer);
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
  // Scripts, and what each module among them imports before it runs, and what those import, to
  // the end, each file once across the page. Answers the weight of the files it loaded first.
  const weighed = new Map<string, AssetWeight>();
  const followed = new Set<string>();
  // The module the entry loads for each assembly, from the maps in the modules it reads.
  const lazy = new Map<string, URL>();
  const load = async (queue: Array<readonly [url: URL, module: boolean]>): Promise<AssetWeight> => {
    const fresh = new Map<string, AssetWeight>();
    while (queue.length > 0) {
      const [url, module] = queue.shift() ?? [target, false];
      if (url.origin !== own) {
        elsewhere.push(url.href);
        continue;
      }
      if (weighed.has(url.href) && (!module || followed.has(url.href))) continue;
      const body = await get(url);
      const weight = weigh(body);
      if (!weighed.has(url.href)) fresh.set(url.href, weight);
      weighed.set(url.href, weight);
      if (!module) continue;
      followed.add(url.href);
      const source = new TextDecoder().decode(body);
      for (const [name, specifier] of lazyModules(source)) {
        if (RESOLVES.test(specifier)) lazy.set(name, new URL(specifier, url));
      }
      for (const specifier of staticImports(source)) {
        if (RESOLVES.test(specifier)) queue.push([new URL(specifier, url), true]);
      }
    }
    return sum([...fresh.values()]);
  };
  const before = await load(scripts);
  // The assemblies the browser mounts on this page: this server's, each once, and not one whose
  // mode keeps it from mounting. What is deferred, and what a module asks for later still, is
  // not known from the page and is not weighed.
  const mounted = new Map<string, URL>();
  for (const { tag, attributes } of tags) {
    const name = attributes[ENVELOPE_ATTRIBUTE.name] ?? "";
    const module = lazy.get(name);
    if (
      tag === ENVELOPE_ELEMENT &&
      module !== undefined &&
      !(ENVELOPE_ATTRIBUTE.remote in attributes) &&
      mountsInTheBrowser(attributes)
    ) {
      mounted.set(name, module);
    }
  }
  const mount = await load([...mounted.values()].map((url) => [url, true] as const));
  const markup = weigh(page);
  return {
    route,
    ...(address === undefined ? {} : { address }),
    document: markup,
    styles,
    scripts: before,
    mount,
    assemblies: mounted.size,
    total: sum([markup, styles, before, mount]),
    elsewhere: [...new Set(elsewhere)],
    fellBack: tags
      .filter(
        ({ tag, attributes }) =>
          tag === ENVELOPE_ELEMENT && ENVELOPE_ATTRIBUTE.failed in attributes,
      )
      .map(({ attributes }) => attributes[ENVELOPE_ATTRIBUTE.name] ?? ""),
  };
}
