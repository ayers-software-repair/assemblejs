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
    expect(html).toBe("<main><p>A</p><p>no B</p></main>");
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

  it("emits nothing for a deferred placement and never reaches it", async () => {
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
    expect(html).toBe("<main><p>a</p></main>");
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
    expect(html).toBe("<main><p>A</p></main>");
    expect(diagnostics[1]?.reason).toBe("transport");
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
