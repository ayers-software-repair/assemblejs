// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMITS,
  compose,
  createMemoryCache,
  defineAssembly,
  localFetch,
  pageAssets,
} from "@assemblejs/core";
import type { AssemblyDefinition, Diagnostic, RemoteTransport } from "@assemblejs/core";

const assembly = (name: string, over: Partial<AssemblyDefinition> = {}): AssemblyDefinition =>
  defineAssembly({
    name,
    views: { default: { renderer: "html", markup: () => "" } },
    assets: { css: [`/${name}.css`], js: [`/${name}.js`] },
    ...over,
  });
const byName = (...all: AssemblyDefinition[]) => new Map(all.map((one) => [one.name, one]));
const placed = (name: string): Diagnostic => ({
  name,
  view: "default",
  id: `id-${name}`,
  source: "local",
  ms: 0,
});
const envelope = (name: string, inside = ""): string =>
  `<assembly-root data-name="${name}" data-id="id-${name}">${inside}</assembly-root>`;
/** A transport that knows one remote assembly's files, and records what it was asked for. */
const remote = (asked: string[] = []): RemoteTransport => ({
  fetch: async () => ({ ok: true, html: "", source: "remote" }),
  assets: async (url) => {
    asked.push(url);
    return { css: ["https://b.example/cart.css"], js: ["https://b.example/client.js"] };
  },
});

describe("the browser files a composed page links", () => {
  it("links what each of this server's placed assemblies declares", async () => {
    const assets = await pageAssets(
      {
        html: envelope("hello") + envelope("cart"),
        diagnostics: [placed("hello"), placed("cart")],
      },
      {},
      byName(assembly("hello"), assembly("cart")),
      remote(),
    );
    expect(assets).toEqual({ css: ["/hello.css", "/cart.css"], js: ["/hello.js", "/cart.js"] });
  });

  it("leaves a shadow assembly's styles to its own root, and still links its modules", async () => {
    const assets = await pageAssets(
      { html: envelope("card"), diagnostics: [placed("card")] },
      {},
      byName(assembly("card", { shadow: true })),
      remote(),
    );
    expect(assets).toEqual({ css: [], js: ["/card.js"] });
  });

  it("links what another server's manifest declared for a placement its plan sends there", async () => {
    const asked: string[] = [];
    const url = "https://b.example/assembly/cart/";
    const assets = await pageAssets(
      { html: "", diagnostics: [{ ...placed("cart"), source: "remote" }] },
      { cart: { name: "cart", view: "default", deadline: 3000, url } },
      // A local assembly of the same name is not the one that was placed.
      byName(assembly("cart")),
      remote(asked),
    );
    expect(asked).toEqual([url]);
    expect(assets).toEqual({
      css: ["https://b.example/cart.css"],
      js: ["https://b.example/client.js"],
    });
  });

  it("links nothing for an assembly that declares no browser files", async () => {
    const plain = defineAssembly({
      name: "plain",
      views: { default: { renderer: "html", markup: () => "" } },
    });
    const assets = await pageAssets(
      { html: envelope("plain"), diagnostics: [placed("plain")] },
      {},
      byName(plain),
      remote(),
    );
    expect(assets).toEqual({ css: [], js: [] });
  });

  it("links a child a view placed, which no placement of the page names", async () => {
    const assets = await pageAssets(
      { html: envelope("shell", envelope("hello")), diagnostics: [placed("shell")] },
      {},
      byName(assembly("shell"), assembly("hello")),
      remote(),
    );
    expect(assets.css).toEqual(["/shell.css", "/hello.css"]);
  });

  // A cache hit answers the html it holds and no account of what is inside it.
  it("links a cached parent's child as it linked a fresh one's", async () => {
    const shell = defineAssembly({
      name: "shell",
      views: { default: { renderer: "html", markup: () => '<assembly name="hello"></assembly>' } },
    });
    const assemblies = byName(shell, assembly("hello"));
    const plan = {
      shell: { name: "shell", view: "default", deadline: 3000, cache: { ttl: 60_000 } },
    };
    const composeOnce = () =>
      compose({
        template: '<body><assembly name="shell"></assembly></body>',
        plan,
        fetch: localFetch(assemblies, () => undefined, DEFAULT_LIMITS),
        cache,
        page: "p1",
        newId: () => `id-${String(++minted)}`,
        now: () => 0,
      });
    const cache = createMemoryCache();
    let minted = 0;
    const fresh = await composeOnce();
    const cached = await composeOnce();
    expect([fresh.diagnostics[0]?.source, cached.diagnostics[0]?.source]).toEqual([
      "local",
      "cache",
    ]);
    expect(cached.diagnostics[0]?.children).toBeUndefined();
    for (const composed of [fresh, cached]) {
      expect((await pageAssets(composed, plan, assemblies, remote())).css).toEqual(["/hello.css"]);
    }
  });
});
