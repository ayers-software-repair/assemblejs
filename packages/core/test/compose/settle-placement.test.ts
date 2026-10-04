// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { settlePlacement } from "@assemblejs/core";
import type { ContentCache, Fetch, SettleInput } from "@assemblejs/core";

const answering =
  (html: string): Fetch =>
  async () => ({ ok: true, html, source: "local" });
const failing: Fetch = async () => ({
  ok: false,
  reason: "status",
  detail: "404",
  correlationId: "c-1",
});

const input = (over: Partial<SettleInput> = {}): SettleInput => ({
  name: "cart",
  view: "default",
  plan: undefined,
  fetch: answering("<p>cart</p>"),
  cache: undefined,
  limits: { depth: 8, maxBytes: 1024 },
  page: "p1",
  depth: 0,
  path: [],
  query: new URLSearchParams(),
  headers: {},
  newId: () => "id-1",
  now: () => 0,
  ...over,
});

const memory = (): ContentCache & { store: Map<string, { html: string }> } => {
  const store = new Map<string, { html: string }>();
  return {
    store,
    get: (key) => store.get(key),
    set: (key, value) => void store.set(key, { html: value.html }),
  };
};

describe("settling one placement", () => {
  it("returns what answered, and says which rung it came from", async () => {
    const settled = await settlePlacement(input());
    expect(settled.html).toBe("<p>cart</p>");
    expect(settled.diagnostic.source).toBe("local");
    expect(settled.diagnostic.reason).toBeUndefined();
  });

  it("does not reach a deferred placement at all", async () => {
    let reached = false;
    const settled = await settlePlacement(
      input({
        plan: { name: "cart", view: "default", deadline: 3000, defer: true },
        fetch: async () => {
          reached = true;
          return { ok: true, html: "x", source: "local" };
        },
      }),
    );
    expect(reached).toBe(false);
    expect(settled.diagnostic.source).toBe("deferred");
    expect(settled.html).toMatch(
      /^<assembly-root data-name="cart" data-id="id-1" [^>]*data-defer="">/,
    );
    expect(settled.html).not.toContain("x<");
  });

  it("falls back to the declared content when nothing answered", async () => {
    const settled = await settlePlacement(
      input({
        fetch: failing,
        plan: { name: "cart", view: "default", deadline: 3000, fallback: "<p>unavailable</p>" },
      }),
    );
    expect(settled.html).toContain('data-failed="c-1"><p>unavailable</p><script');
    expect(settled.diagnostic.source).toBe("fallback");
    expect(settled.diagnostic.reason).toBe("status");
    expect(settled.diagnostic.correlationId).toBe("c-1");
  });

  it("answers a refusal before dispatch with its fallback, never with cached content", async () => {
    const cache = memory();
    cache.set("cart/default", { html: "<p>cached</p>" }, 60_000);
    const settled = await settlePlacement(
      input({
        path: ["page/default", "cart/default"],
        fetch: failing,
        cache,
        plan: { name: "cart", view: "default", deadline: 3000, cache: { ttl: 60_000 } },
      }),
    );
    expect(settled.diagnostic.reason).toBe("cycle");
    expect(settled.html).not.toContain("cached");
  });

  it("renders an empty envelope marked failed, with an account, when there is nothing else", async () => {
    const settled = await settlePlacement(input({ fetch: failing }));
    expect(settled.html).toMatch(/^<assembly-root data-name="cart" [^>]*data-failed="c-1"><script/);
    expect(settled.diagnostic.source).toBe("fallback");
  });

  it("gives a failure an id even when its transport reported none", async () => {
    const silent = async () => ({ ok: false, reason: "timeout", detail: "", correlationId: "" });
    const settled = await settlePlacement(input({ fetch: silent as never }));
    expect(settled.html).toContain(`data-failed="id-1"`);
  });

  it("writes to the cache only when a ttl was declared", async () => {
    const withoutTtl = memory();
    await settlePlacement(input({ cache: withoutTtl }));
    expect(withoutTtl.store.size).toBe(0);

    const withTtl = memory();
    await settlePlacement(
      input({
        cache: withTtl,
        plan: { name: "cart", view: "default", deadline: 3000, cache: { ttl: 60_000 } },
      }),
    );
    expect(withTtl.store.get("cart/default")?.html).toBe("<p>cart</p>");
  });

  it("never caches a credentialled response, in either direction", async () => {
    const cache = memory();
    const plan = { name: "cart", view: "default", deadline: 3000, cache: { ttl: 60_000 } };
    await settlePlacement(input({ cache, plan, headers: { authorization: "Bearer x" } }));
    expect(cache.store.size).toBe(0);

    cache.set("cart/default", { html: "<p>someone else</p>" }, 60_000);
    const settled = await settlePlacement(
      input({ cache, plan, fetch: failing, headers: { cookie: "s=1" } }),
    );
    // One visitor must never be handed another visitor's page.
    expect(settled.html).not.toBe("<p>someone else</p>");
  });

  it("refuses a request past the depth cap before it dispatches", async () => {
    let dispatched = false;
    const settled = await settlePlacement(
      input({
        depth: 8,
        limits: { depth: 8, maxBytes: 1024 },
        fetch: async () => {
          dispatched = true;
          return { ok: true, html: "x", source: "local" };
        },
      }),
    );
    expect(dispatched).toBe(false);
    expect(settled.diagnostic.reason).toBe("depth");
  });

  it("refuses an assembly that is already on its own ancestor path", async () => {
    let dispatched = false;
    const settled = await settlePlacement(
      input({
        path: ["page/default", "cart/default"],
        fetch: async () => {
          dispatched = true;
          return { ok: true, html: "x", source: "local" };
        },
      }),
    );
    expect(dispatched).toBe(false);
    expect(settled.diagnostic.reason).toBe("cycle");
  });

  it("sends its ancestors' identities, never instance ids and never itself", async () => {
    let seen: readonly string[] = [];
    await settlePlacement(
      input({
        path: ["page/default"],
        newId: () => "a-fresh-uuid",
        fetch: async (request) => {
          seen = request.path;
          return { ok: true, html: "", source: "local" };
        },
      }),
    );
    // An instance id is minted fresh per request, so a path of them could never collide and the
    // cycle check would silently never fire. The target is not its own ancestor: a server that
    // refuses a path naming itself, as DESIGN 3.4 says it does, must not refuse every request.
    expect(seen).toEqual(["page/default"]);
    expect(seen).not.toContain("a-fresh-uuid");
  });

  it("answers on its own deadline even when the transport ignores the signal", async () => {
    const started = Date.now();
    const settled = await settlePlacement(
      input({
        plan: { name: "cart", view: "default", deadline: 20 },
        // A fetch that never settles and never looks at its signal.
        fetch: () => new Promise(() => {}),
      }),
    );
    expect(settled.diagnostic.reason).toBe("timeout");
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("asks the transport to stop when the deadline passes", async () => {
    let aborted = false;
    await settlePlacement(
      input({
        plan: { name: "cart", view: "default", deadline: 10 },
        fetch: (request) =>
          new Promise((resolve) => {
            request.signal.addEventListener("abort", () => {
              aborted = true;
              resolve({ ok: false, reason: "timeout", detail: "aborted", correlationId: "" });
            });
          }),
      }),
    );
    expect(aborted).toBe(true);
  });

  it("answers rather than propagating when the transport throws", async () => {
    const settled = await settlePlacement(
      input({
        fetch: async () => {
          throw new Error("connection refused");
        },
      }),
    );
    expect(settled.diagnostic.reason).toBe("transport");
  });

  it("throws only for a placement declared required", async () => {
    await expect(
      settlePlacement(
        input({
          fetch: failing,
          plan: { name: "cart", view: "default", deadline: 3000, required: true },
        }),
      ),
    ).rejects.toThrow(/required assembly "cart"/);
  });
});

// Each of the following was found by an adversarial verification pass. The type says a Fetch
// returns a Promise of a result; a type is a promise about source, not about what a caller
// actually hands over, and every one of these took the page down.
describe("a transport that does not behave", () => {
  it("answers when the transport throws before it returns", async () => {
    const settled = await settlePlacement(
      input({
        fetch: (() => {
          throw new Error("boom");
        }) as never,
      }),
    );
    expect(settled.diagnostic.reason).toBe("transport");
  });

  it("answers when the transport returns something that is not a promise", async () => {
    const settled = await settlePlacement(
      input({ fetch: (() => ({ ok: true, html: "x", source: "local" })) as never }),
    );
    expect(settled.html).toBe("x");
  });

  it("answers when the transport resolves to nothing", async () => {
    for (const nothing of [undefined, null, 42, "text"]) {
      const settled = await settlePlacement(input({ fetch: (async () => nothing) as never }));
      expect(settled.diagnostic.reason).toBe("invalid");
    }
  });

  it("answers when the transport resolves to an object with no ok", async () => {
    const settled = await settlePlacement(input({ fetch: (async () => ({ html: "x" })) as never }));
    expect(settled.diagnostic.reason).toBe("invalid");
  });
});
