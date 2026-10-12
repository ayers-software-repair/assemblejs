// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { countPlacements, createServer, defineAssembly, placementCache } from "@assemblejs/core";
import type { Admit, AssemblyPlan, ContentCache, Diagnostic, SettleInput } from "@assemblejs/core";

const memory = (): ContentCache & { store: Map<string, string> } => {
  const store = new Map<string, string>();
  return {
    store,
    get: (key) => {
      const html = store.get(key);
      return html === undefined ? undefined : { html };
    },
    set: (key, value) => void store.set(key, value.html),
  };
};

const input = (
  cache: ContentCache,
  plan: Partial<AssemblyPlan>,
  headers: Record<string, string> = {},
): SettleInput => ({
  name: "cart",
  view: "default",
  plan: { name: "cart", view: "default", deadline: 3000, ...plan },
  fetch: async () => ({ ok: true, html: "", source: "local" }),
  cache,
  limits: { depth: 8, maxBytes: 1024, placements: 64 },
  page: "p1",
  depth: 0,
  path: [],
  ordinal: 1,
  count: countPlacements(() => "c-0"),
  query: new URLSearchParams(),
  params: {},
  headers,
  signal: undefined,
  admit: undefined,
  newId: () => "id",
  now: () => 0,
});

describe("one placement's view of the server's cache", () => {
  it("reads and writes for a placement that declared a lifetime", async () => {
    const cache = memory();
    placementCache(input(cache, { cache: { ttl: 1000 } })).write("<p>cart</p>", undefined);
    expect(await placementCache(input(cache, { cache: { ttl: 1000 } })).read()).toBe("<p>cart</p>");
  });

  it("neither reads nor writes for one that declared none, whatever another page cached", async () => {
    const cache = memory();
    placementCache(input(cache, {})).write("<p>mine</p>", undefined);
    expect(cache.store.size).toBe(0);
    placementCache(input(cache, { cache: { ttl: 1000 } })).write("<p>theirs</p>", undefined);
    expect(await placementCache(input(cache, {})).read()).toBeUndefined();
  });

  it("neither reads nor writes for a request carrying a credential", async () => {
    const cache = memory();
    const plan = { cache: { ttl: 1000 } };
    placementCache(input(cache, plan, { authorization: "Bearer x" })).write("<p>x</p>", undefined);
    expect(cache.store.size).toBe(0);
    placementCache(input(cache, plan)).write("<p>shared</p>", undefined);
    expect(await placementCache(input(cache, plan, { cookie: "s=1" })).read()).toBeUndefined();
  });

  it("never writes an answer holding a failed envelope: a failure is not content", async () => {
    const cache = memory();
    const plan = { cache: { ttl: 1000 } };
    const child = (failed: string) => `<assembly-root data-name="cart"${failed}></assembly-root>`;
    const shell = (inside: string) => `<assembly-root data-name="shell">${inside}</assembly-root>`;
    // A parent that answered, with a child inside it that fell back: served once, never kept.
    placementCache(input(cache, plan)).write(shell(child(' data-failed="c-1"')), undefined);
    expect(cache.store.size).toBe(0);
    placementCache(input(cache, plan)).write(shell(child("")), undefined);
    expect(await placementCache(input(cache, plan)).read()).toBe(shell(child("")));
  });

  it("keeps what each lifetime cached apart, so a shorter one never reads a longer one's", async () => {
    const cache = memory();
    placementCache(input(cache, { cache: { ttl: 60_000 } })).write("<p>long</p>", undefined);
    expect(await placementCache(input(cache, { cache: { ttl: 1000 } })).read()).toBeUndefined();
    expect(await placementCache(input(cache, { cache: { ttl: 60_000 } })).read()).toBe(
      "<p>long</p>",
    );
  });
});

// Found 2026-10-11. An answer holds what its assembly's view placed, composed for the visitor
// who filled the cache, and the cache was read after asking about the outer assembly alone.
describe("a cached answer that holds another assembly", () => {
  const whole = (): ContentCache => {
    const store = new Map<string, Parameters<ContentCache["set"]>[1]>();
    return { get: (key) => store.get(key), set: (key, value) => void store.set(key, value) };
  };
  const placed = (name: string, children?: readonly Diagnostic[]): Diagnostic => ({
    name,
    view: "default",
    id: `id-${name}`,
    source: "local",
    ms: 1,
    ...(children === undefined ? {} : { children }),
  });
  const asked = (cache: ContentCache, admit: Admit | undefined): SettleInput => ({
    ...input(cache, { cache: { ttl: 1000 } }),
    admit,
  });
  const only =
    (...names: string[]): Admit =>
    (name) => ({ admitted: names.includes(name) });

  it("is a visitor's only when each assembly inside it would be shown to them", async () => {
    const cache = whole();
    const nested = [placed("badge", [placed("balance")]), placed("badge")];
    placementCache(asked(cache, only("badge", "balance"))).write(
      "<p>member</p>",
      undefined,
      nested,
    );
    expect(await placementCache(asked(cache, only("badge", "balance"))).read()).toBe(
      "<p>member</p>",
    );
    expect(await placementCache(asked(cache, only("badge"))).read()).toBeUndefined();
    expect(await placementCache(asked(cache, only())).read()).toBeUndefined();
    // Where no control is on, everyone is shown everything, and nothing is asked.
    expect(await placementCache(asked(cache, undefined)).read()).toBe("<p>member</p>");
  });

  it("is no answer under a control when what it holds was not recorded, or asking throws", async () => {
    const cache = whole();
    cache.set("1000|cart/default", { html: "<p>unrecorded</p>" }, 1000);
    expect(await placementCache(asked(cache, only("badge"))).read()).toBeUndefined();
    expect(await placementCache(asked(cache, undefined)).read()).toBe("<p>unrecorded</p>");
    placementCache(asked(cache, only("badge"))).write("<p>held</p>", undefined, [placed("badge")]);
    const broken: Admit = () => {
      throw new Error("the directory is down");
    };
    expect(await placementCache(asked(cache, broken)).read()).toBeUndefined();
  });

  it("is not asked about a placement the browser fills later, which holds no content", async () => {
    const cache = whole();
    const later: Diagnostic = { ...placed("reviews"), source: "deferred" };
    placementCache(asked(cache, only())).write("<p>shell</p>", undefined, [later]);
    expect(await placementCache(asked(cache, only())).read()).toBe("<p>shell</p>");
  });

  it("through a server: the visitor after a member is not shown the member's guarded child", async () => {
    const view = (name: string, markup: string) =>
      defineAssembly({ name, views: { default: { renderer: "html", markup: () => markup } } });
    const app = await createServer({
      config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
      log: () => undefined,
      assemblies: [
        view("balance", "<p>BALANCE-9912</p>"),
        view("sidebar", '<aside>sidebar</aside><assembly name="balance"></assembly>'),
      ],
      authenticate: (request) => request.headers["x-token"] === "member",
      publicRoutes: ["/", "/assembly/sidebar/*"],
      pages: [
        {
          route: "/",
          template: '<body><assembly name="sidebar"></assembly></body>',
          place: { sidebar: { cache: { ttl: 60_000 } } },
        },
      ],
    });
    try {
      const get = async (headers: Record<string, string> = {}) =>
        (await app.inject({ method: "GET", url: "/", headers })).body;
      expect(await get()).not.toContain("BALANCE-9912");
      expect(await get({ "x-token": "member" })).toContain("BALANCE-9912");
      const after = await get();
      expect(after).toContain("sidebar");
      expect(after).not.toContain("BALANCE-9912");
      // A member is still answered from the cache: the same envelope id as the member before.
      const again = await get({ "x-token": "member" });
      expect(again).toContain("BALANCE-9912");
    } finally {
      await app.close();
    }
  });
});
