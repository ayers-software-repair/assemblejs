// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly, defineService, localFetch } from "@assemblejs/core";
import type { AssemblyRequest, LogLine } from "@assemblejs/core";

const hello = defineAssembly({
  name: "hello",
  views: { default: { renderer: "html", markup: () => "<p>hi</p>" } },
});
const broken = defineAssembly({
  name: "broken",
  views: {
    default: {
      renderer: "html",
      markup: () => {
        throw new Error("connection to postgres://user:hunter2@db refused");
      },
    },
  },
});

const limits = { depth: 3, maxBytes: 1024 * 1024, placements: 64 };
const request = (name: string, view = "default"): AssemblyRequest => ({
  name,
  view,
  id: "a7f3",
  page: "p",
  depth: 1,
  path: [],
  query: new URLSearchParams(),
  params: {},
  headers: {},
  signal: new AbortController().signal,
});

describe("the composer's local transport", () => {
  const logged: LogLine[] = [];
  const fetch = localFetch(
    new Map([
      ["hello", hello],
      ["broken", broken],
    ]),
    (line) => logged.push(line),
    limits,
  );

  it("renders a local assembly in its envelope, stamped with the id the parent allocated", async () => {
    const answer = await fetch(request("hello"));
    expect(answer.ok).toBe(true);
    if (answer.ok) {
      expect(answer.source).toBe("local");
      expect(answer.html).toContain('data-id="a7f3"');
    }
  });

  it("answers an unknown assembly or view as a failure, never a throw", async () => {
    expect((await fetch(request("nope"))).ok).toBe(false);
    expect((await fetch(request("hello", "wide"))).ok).toBe(false);
  });

  it("logs a render that throws against an id, and keeps the message out of the answer", async () => {
    const answer = await fetch(request("broken"));
    expect(answer.ok).toBe(false);
    if (!answer.ok) {
      expect(JSON.stringify(answer)).not.toContain("hunter2");
      expect(logged.at(-1)?.correlationId).toBe(answer.correlationId);
      expect(logged.at(-1)?.message).toContain("hunter2");
    }
  });

  it("hands the page's parameters to the assembly's services", async () => {
    const item = defineAssembly({
      name: "item",
      views: {
        default: {
          renderer: "html",
          services: [
            defineService({
              name: "item",
              schema: { properties: { sku: { type: "string" } }, required: ["sku"] },
              run: ({ params }) => ({ sku: params["sku"] ?? "none" }),
            }),
          ],
          markup: ({ data }) => `<p>${String(data["sku"])}</p>`,
        },
      },
    });
    const own = localFetch(new Map([["item", item]]), () => undefined, limits);
    const answer = await own({ ...request("item"), params: { sku: "a1" } });
    expect(answer.ok && answer.html).toContain("<p>a1</p>");
    const none = await own(request("item"));
    expect(none.ok && none.html).toContain("<p>none</p>");
  });

  it("carries how each child of the assembly it rendered was answered, and nothing for none", async () => {
    const shell = defineAssembly({
      name: "shell",
      views: {
        default: {
          renderer: "html",
          markup: () => '<assembly name="hello"></assembly><assembly name="broken"></assembly>',
        },
      },
    });
    const own = localFetch(
      new Map([
        ["shell", shell],
        ["hello", hello],
        ["broken", broken],
      ]),
      () => undefined,
      limits,
    );
    const answer = await own(request("shell"));
    expect(answer.ok && answer.nested).toMatchObject([
      { name: "hello", source: "local" },
      { name: "broken", source: "fallback", reason: "status" },
    ]);
    // The children are in the parent's envelope, each in its own, and were asked one deeper.
    expect(answer.ok && answer.html.match(/<assembly-root/g)).toHaveLength(3);
    const childless = await own(request("hello"));
    expect(childless.ok && "nested" in childless).toBe(false);
  });
});

describe("how many assemblies one request places", () => {
  // A shelf holds as many items as it is asked for, and each item holds a leaf of its own.
  const shelved = () => {
    const renders = { item: 0, leaf: 0 };
    const leaf = defineAssembly({
      name: "leaf",
      views: {
        default: { renderer: "html", markup: () => `<i>${String((renders.leaf += 1))}</i>` },
      },
    });
    const item = defineAssembly({
      name: "item",
      views: {
        default: {
          renderer: "html",
          markup: () => `<b>${String((renders.item += 1))}</b><assembly name="leaf"></assembly>`,
        },
      },
    });
    const shelf = defineAssembly({
      name: "shelf",
      views: {
        default: {
          renderer: "html",
          data: ({ query }) => ({ items: Number(query.get("items")) }),
          markup: ({ data }) => '<assembly name="item"></assembly>'.repeat(Number(data["items"])),
        },
      },
    });
    const fetch = localFetch(
      new Map([leaf, item, shelf].map((one) => [one.name, one])),
      () => undefined,
      { depth: 8, maxBytes: 1024 * 1024, placements: 6 },
    );
    const asked = async (items: number, over: Partial<AssemblyRequest> = {}) => {
      const answer = await fetch({
        ...request("shelf"),
        query: new URLSearchParams({ items: String(items) }),
        ...over,
      });
      if (!answer.ok) throw new Error(answer.detail);
      const refused: string[] = [];
      const walk = (diagnostics: typeof answer.nested): void => {
        for (const one of diagnostics ?? []) {
          if (one.reason !== undefined) refused.push(one.reason);
          walk(one.children);
        }
      };
      walk(answer.nested);
      return { html: answer.html, refused };
    };
    return { renders, asked };
  };

  it("places every one while the request is under the limit", async () => {
    const { renders, asked } = shelved();
    expect((await asked(3)).refused).toEqual([]);
    expect(renders).toEqual({ item: 3, leaf: 3 });
  });

  it("never places more than the limit at every depth together, and renders none past it", async () => {
    const { renders, asked } = shelved();
    const { refused } = await asked(5);
    // Five items and their five leaves are ten: six are placed and rendered, four refused.
    expect(renders.item + renders.leaf).toBe(6);
    expect(refused).toEqual(Array(4).fill("too-many"));
  });

  it("refuses the ones past it in one template in the order they are written", async () => {
    const { renders, asked } = shelved();
    const { html, refused } = await asked(8);
    expect(renders).toEqual({ item: 6, leaf: 0 });
    expect(refused).toHaveLength(8);
    const items = [...html.matchAll(/<assembly-root data-name="item"[^>]*>/g)].map((tag) =>
      tag[0].includes("data-failed"),
    );
    expect(items).toEqual([false, false, false, false, false, false, true, true]);
  });

  it("numbers a request's placements from the count the request was handed", async () => {
    const { renders, asked } = shelved();
    let placed = 4;
    const { refused } = await asked(3, { count: () => (placed += 1) });
    // Numbered five, six and seven: two items are placed, and nothing after them is.
    expect(renders).toEqual({ item: 2, leaf: 0 });
    expect(refused).toHaveLength(3);
    expect(placed).toBe(9);
  });

  it("starts each request's count afresh", async () => {
    const { renders, asked } = shelved();
    await asked(8);
    expect((await asked(3)).refused).toEqual([]);
    expect(renders).toEqual({ item: 9, leaf: 3 });
  });
});
