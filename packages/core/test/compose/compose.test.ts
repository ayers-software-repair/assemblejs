// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { compose } from "@assemblejs/core";
import type { ComposeOptions, Fetch } from "@assemblejs/core";

const byName =
  (answers: Record<string, string>, delays: Record<string, number> = {}): Fetch =>
  async (request) => {
    const delay = delays[request.name] ?? 0;
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    const html = answers[request.name];
    if (html === undefined) {
      return { ok: false, reason: "status", detail: "404", correlationId: `c-${request.name}` };
    }
    return { ok: true, html, source: "local" };
  };

let counter = 0;
const options = (over: Partial<ComposeOptions> = {}): ComposeOptions => ({
  template: `<main><assembly name="a"/><assembly name="b"/></main>`,
  plan: {},
  fetch: byName({ a: "<p>A</p>", b: "<p>B</p>" }),
  page: "p1",
  newId: () => `id-${++counter}`,
  now: () => 0,
  ...over,
});

describe("composing a page", () => {
  it("substitutes each placement in place and leaves the rest of the template alone", async () => {
    const { html } = await compose(options());
    expect(html).toBe("<main><p>A</p><p>B</p></main>");
  });

  it("keeps the template's order however the placements finished", async () => {
    // The first placement is the slow one, so a naive implementation would emit them reversed.
    const { html } = await compose(
      options({ fetch: byName({ a: "<p>A</p>", b: "<p>B</p>" }, { a: 30 }) }),
    );
    expect(html).toBe("<main><p>A</p><p>B</p></main>");
  });

  it("returns one diagnostic per placement, always", async () => {
    const { diagnostics } = await compose(options());
    expect(diagnostics.map((d) => d.name)).toEqual(["a", "b"]);
    expect(diagnostics.every((d) => d.source === "local")).toBe(true);
  });

  it("gives every placement its own id", async () => {
    const { diagnostics } = await compose(options());
    expect(new Set(diagnostics.map((d) => d.id)).size).toBe(2);
  });

  it("lets one placement fail without taking the page or its siblings with it", async () => {
    const { html, diagnostics } = await compose(
      options({
        fetch: byName({ a: "<p>A</p>" }),
        plan: { b: { name: "b", view: "default", deadline: 3000, fallback: "<p>no B</p>" } },
      }),
    );
    expect(html).toMatch(
      /^<main><p>A<\/p><assembly-root data-name="b" [^>]*data-failed="c-b"><p>no B<\/p><script/,
    );
    expect(diagnostics[0]?.source).toBe("local");
    expect(diagnostics[1]?.source).toBe("fallback");
    expect(diagnostics[1]?.correlationId).toBe("c-b");
  });

  it("settles placements concurrently, not one after another", async () => {
    const started = Date.now();
    await compose(options({ fetch: byName({ a: "<p>A</p>", b: "<p>B</p>" }, { a: 60, b: 60 }) }));
    // Sequential would be about 120ms; concurrent is about 60.
    expect(Date.now() - started).toBeLessThan(110);
  });

  it("is ready when the slowest placement times out, not when it finishes", async () => {
    const started = Date.now();
    const { diagnostics } = await compose(
      options({
        // Both placements get the short deadline: one left on the default would hold the page
        // for the default's three seconds and the elapsed assertion below would be measuring it.
        plan: {
          a: { name: "a", view: "default", deadline: 20 },
          b: { name: "b", view: "default", deadline: 20 },
        },
        fetch: () => new Promise(() => {}),
      }),
    );
    expect(Date.now() - started).toBeLessThan(2000);
    expect(diagnostics.every((d) => d.reason === "timeout")).toBe(true);
  });

  it("emits an empty envelope for a deferred placement and never reaches it", async () => {
    let reached = 0;
    const { html, diagnostics } = await compose(
      options({
        plan: { b: { name: "b", view: "default", deadline: 3000, defer: true } },
        fetch: async (request) => {
          reached += 1;
          return { ok: true, html: `<p>${request.name}</p>`, source: "local" };
        },
      }),
    );
    expect(reached).toBe(1);
    // DESIGN 3.5: the browser fills it, by the id its envelope carries.
    expect(html).toMatch(/^<main><p>a<\/p><assembly-root data-name="b" [^>]*data-defer=""><script/);
    expect(html).not.toContain("<p>b</p>");
    expect(diagnostics[1]?.source).toBe("deferred");
  });

  it("dies only for a placement declared required, and says which", async () => {
    await expect(
      compose(
        options({
          fetch: byName({ a: "<p>A</p>" }),
          plan: { b: { name: "b", view: "default", deadline: 3000, required: true } },
        }),
      ),
    ).rejects.toThrow(/required assembly "b"/);
  });

  it("refuses a declaration that is both deferred and required, before it fetches anything", async () => {
    let reached = false;
    await expect(
      compose(
        options({
          plan: { b: { name: "b", view: "default", deadline: 3000, defer: true, required: true } },
          fetch: async () => {
            reached = true;
            return { ok: true, html: "", source: "local" };
          },
        }),
      ),
    ).rejects.toThrow(/both deferred and required/);
    expect(reached).toBe(false);
  });

  it("composes a template with no placements unchanged", async () => {
    const { html, diagnostics } = await compose(
      options({ template: "<main><p>static</p></main>" }),
    );
    expect(html).toBe("<main><p>static</p></main>");
    expect(diagnostics).toEqual([]);
  });

  it("passes the page and the depth down to every request", async () => {
    const seen: Array<{ page: string; depth: number }> = [];
    await compose(
      options({
        depth: 2,
        fetch: async (request) => {
          seen.push({ page: request.page, depth: request.depth });
          return { ok: true, html: "", source: "local" };
        },
      }),
    );
    expect(seen).toEqual([
      { page: "p1", depth: 3 },
      { page: "p1", depth: 3 },
    ]);
  });

  it("reaches no transport at all when the template is refused", async () => {
    let reached = false;
    await expect(
      compose(
        options({
          template: `<assembly name="a" timeout="5"/>`,
          fetch: async () => {
            reached = true;
            return { ok: true, html: "", source: "local" };
          },
        }),
      ),
    ).rejects.toThrow(/unknown attribute/);
    expect(reached).toBe(false);
  });
});

describe("a placement that settles badly", () => {
  it("does not take the page down when it was never declared required", async () => {
    // compose used to re-throw any rejection, discarding what allSettled bought two lines above.
    const { html, diagnostics } = await compose(
      options({
        fetch: ((request: { name: string }) => {
          if (request.name === "b") throw new Error("boom");
          return Promise.resolve({ ok: true, html: "<p>A</p>", source: "local" });
        }) as never,
      }),
    );
    expect(html).toMatch(/^<main><p>A<\/p><assembly-root data-name="b" [^>]*data-failed="[^"]+">/);
    expect(diagnostics[1]?.reason).toBe("transport");
    // The transport threw and reported no id, so the composer minted one rather than leave the
    // failure unfindable.
    expect(diagnostics[1]?.correlationId).toMatch(/.+/);
  });
});

describe("a placement whose name is also a property of Object", () => {
  it("does not read the prototype for its plan", async () => {
    // "constructor" satisfies the name rule, and a bare lookup would hand compose a function.
    const { html, diagnostics } = await compose(
      options({
        template: `<main><assembly name="constructor"/></main>`,
        plan: {},
        fetch: async () => ({ ok: true, html: "<p>ok</p>", source: "local" }),
      }),
    );
    expect(html).toBe("<main><p>ok</p></main>");
    expect(diagnostics[0]?.source).toBe("local");
  });
});

describe("a placement that declared a cache lifetime", () => {
  it("is answered from its fresh entry, without a request, the second time", async () => {
    let requests = 0;
    const store = new Map<string, { html: string }>();
    const cache = {
      get: (key: string) => store.get(key),
      set: (key: string, value: { html: string }) => void store.set(key, value),
    };
    const fetch: Fetch = async () => {
      requests += 1;
      return { ok: true, html: "<p>A</p>", source: "local" };
    };
    const plan = { a: { name: "a", view: "default", deadline: 1000, cache: { ttl: 60_000 } } };
    const template = `<main><assembly name="a"/></main>`;
    await compose(options({ template, plan, fetch, cache }));
    const second = await compose(options({ template, plan, fetch, cache }));
    expect(requests).toBe(1);
    expect(second.diagnostics[0]?.source).toBe("cache");
    // Never for a request carrying a credential, whose answer belongs to one visitor.
    await compose(options({ template, plan, fetch, cache, headers: { cookie: "s=1" } }));
    expect(requests).toBe(2);
  });

  it("never serves one visitor's answer to another who sent a different forwarded header", async () => {
    const store = new Map<string, { html: string }>();
    const cache = {
      get: (key: string) => store.get(key),
      set: (key: string, value: { html: string }) => void store.set(key, value),
    };
    let up = true;
    const fetch: Fetch = async (request) =>
      up
        ? { ok: true, html: `<p>${request.headers["x-user"] ?? ""}</p>`, source: "remote" }
        : { ok: false, reason: "status", detail: "503", correlationId: "c" };
    const plan = { a: { name: "a", view: "default", deadline: 1000, cache: { ttl: 60_000 } } };
    const template = `<main><assembly name="a"/></main>`;
    const as = (user: string) =>
      compose(options({ template, plan, fetch, cache, headers: { "x-user": user } }));
    await as("alice");
    expect((await as("bob")).html).toBe("<main><p>bob</p></main>");
    // Nor as the last good content when the next request fails.
    up = false;
    expect((await as("carol")).html).not.toContain("alice");
    expect((await as("alice")).html).toBe("<main><p>alice</p></main>");
  });
});

describe("the size cap", () => {
  it("holds whichever transport answered, so a local render is bounded like a remote one", async () => {
    const { diagnostics, html } = await compose(
      options({
        template: `<main><assembly name="a"/></main>`,
        fetch: byName({ a: `<p>${"x".repeat(100)}</p>` }),
        limits: { depth: 8, maxBytes: 50 },
      }),
    );
    expect(diagnostics[0]).toMatchObject({ source: "fallback", reason: "too-large" });
    expect(html).not.toContain("xxxx");
  });
});
