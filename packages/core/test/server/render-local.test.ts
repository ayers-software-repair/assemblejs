// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly, defineService, localFetch, renderLocal } from "@assemblejs/core";
import type {
  AssemblyDefinition,
  AssemblyRequest,
  Fetch,
  LocalRenderInput,
} from "@assemblejs/core";

const limits = { depth: 3, maxBytes: 1024 * 1024 };
let minted = 0;
const given = (over: Partial<LocalRenderInput> = {}): LocalRenderInput => ({
  id: "a7f3",
  page: "p1",
  depth: 1,
  path: [],
  query: new URLSearchParams(),
  params: {},
  fetch: async () => ({ ok: false, reason: "status", detail: "none here", correlationId: "c-0" }),
  assemblies: new Map(),
  limits,
  newId: () => `id-${String(++minted)}`,
  now: () => 0,
  ...over,
});

const hello = defineAssembly({
  name: "hello",
  mount: "visible",
  views: {
    default: {
      renderer: "html",
      data: ({ query }) => ({ who: query.get("who") ?? "world" }),
      markup: ({ data }) => `<p>Hello, ${String(data["who"])}</p>`,
    },
  },
});

/** An html assembly that counts its renders, and refuses to run away should a guard fail. */
const counted = (name: string, markup: string): AssemblyDefinition & { renders: () => number } => {
  let renders = 0;
  const assembly = defineAssembly({
    name,
    views: {
      default: {
        renderer: "html",
        markup: () => {
          renders += 1;
          if (renders > 20) throw new Error(`${name} rendered more than twenty times`);
          return markup;
        },
      },
    },
  });
  return { ...assembly, renders: () => renders };
};
const place = (name: string): string => `<section><assembly name="${name}"></assembly></section>`;
const server = (...assemblies: AssemblyDefinition[]): Fetch =>
  localFetch(
    new Map(assemblies.map((assembly) => [assembly.name, assembly])),
    () => undefined,
    limits,
  );

describe("rendering an assembly in this process", () => {
  it("answers its markup and data in the envelope, stamped with the given id", async () => {
    const { html, diagnostics } = await renderLocal(
      hello,
      "default",
      given({ query: new URLSearchParams("who=ada") }),
    );
    expect(html).toContain("<p>Hello, ada</p>");
    expect(html).toContain('data-id="a7f3"');
    expect(html).toContain('"data":{"who":"ada"}');
    expect(html).toContain('data-mount="visible"');
    expect(diagnostics).toEqual([]);
  });

  it("refuses a view the assembly does not have", async () => {
    await expect(renderLocal(hello, "wide", given())).rejects.toThrow(/no view "wide"/);
  });

  it("renders an assembly that opted into Shadow DOM inside its shadow root, with its styles", async () => {
    const isolated = defineAssembly({
      name: "card",
      shadow: true,
      views: { default: { renderer: "html", markup: () => "<p>card</p>" } },
      assets: { css: ["/_assemblejs/assets/styles/card-1.css"], js: [] },
    });
    expect((await renderLocal(isolated, "default", given())).html).toContain(
      '<template shadowrootmode="open"><p>card</p><link rel="stylesheet" href="/_assemblejs/assets/styles/card-1.css"></template>',
    );
  });

  it("links, inside a shadow parent's root, the sheets of the children placed there", async () => {
    const sheet = (name: string, shadow: boolean, markup: string) =>
      defineAssembly({
        name,
        ...(shadow ? { shadow: true } : {}),
        views: { default: { renderer: "html", markup: () => markup } },
        assets: { css: [`/${name}.css`], js: [] },
      });
    const frame = sheet("frame", true, place("plain") + place("inner"));
    const all = [
      frame,
      sheet("plain", false, "<p>plain</p>"),
      sheet("inner", true, "<p>inner</p>"),
    ];
    const assemblies = new Map(all.map((assembly) => [assembly.name, assembly]));
    const { html } = await renderLocal(
      frame,
      "default",
      given({ fetch: localFetch(assemblies, () => undefined, limits), assemblies }),
    );
    // A sheet in the page's head does not reach into a root: the plain child's is linked in the
    // frame's, after the frame's own. The inner shadow child's is in its own root, and only there.
    expect(html).toMatch(
      /<link rel="stylesheet" href="\/frame\.css"><link rel="stylesheet" href="\/plain\.css"><\/template><script/,
    );
    expect(html.match(/href="\/inner\.css"/g)).toHaveLength(1);
  });

  it("gives the view the placement's id, the one its envelope carries", async () => {
    let seen: string | undefined;
    const echo = defineAssembly({
      name: "echo",
      views: { default: { renderer: "html", markup: (input) => ((seen = input.id), "<p></p>") } },
    });
    const { html } = await renderLocal(echo, "default", given({ id: "b5c1" }));
    expect(seen).toBe("b5c1");
    expect(html).toContain('data-id="b5c1"');
  });
});

describe("a view that places a child", () => {
  it("has the child's envelope where its directive stood, asked for one level deeper", async () => {
    const asked: AssemblyRequest[] = [];
    const local = server(hello);
    const fetch: Fetch = (request) => (asked.push(request), local(request));
    const shell = counted("shell", place("hello"));
    const { html, diagnostics } = await renderLocal(
      shell,
      "default",
      given({
        fetch,
        depth: 1,
        path: ["page/default"],
        params: { sku: "a1" },
        query: new URLSearchParams("sort=price"),
      }),
    );
    expect(html).toMatch(
      /^<assembly-root data-name="shell"[^>]*><section><assembly-root data-name="hello"[^>]*><p>Hello, world<\/p>/,
    );
    expect(html).not.toMatch(/<assembly /);
    expect(diagnostics).toMatchObject([{ name: "hello", view: "default", source: "local" }]);
    // The child is asked as a page's placement is: the same page, one deeper, the parent among
    // its ancestors, and the parameters and the query its parent was given, for its services.
    expect(asked).toMatchObject([
      { name: "hello", page: "p1", depth: 2, path: ["page/default", "shell/default"] },
    ]);
    expect(asked[0]?.params).toEqual({ sku: "a1" });
    expect(asked[0]?.query.get("sort")).toBe("price");
    expect(shell.renders()).toBe(1);
  });

  it("places nothing for a directive that reached it as data, escaped as text", async () => {
    const quoting = defineAssembly({
      name: "quoting",
      views: {
        default: {
          renderer: "html",
          services: [
            defineService({
              name: "note",
              schema: { properties: { note: { type: "string" } }, required: ["note"] },
              run: () => ({ note: '<assembly name="hello"></assembly>' }),
            }),
          ],
          markup: ({ data }) => `<p>${String(data["note"]).replaceAll("<", "&lt;")}</p>`,
        },
      },
    });
    const { html, diagnostics } = await renderLocal(
      quoting,
      "default",
      given({ fetch: server(hello) }),
    );
    expect(diagnostics).toEqual([]);
    expect(html.match(/<assembly-root/g)).toHaveLength(1);
  });

  it("refuses a child that is its own ancestor before dispatching it, and renders once", async () => {
    const loop = counted("loop", place("loop"));
    const { html, diagnostics } = await renderLocal(
      loop,
      "default",
      given({ fetch: server(loop) }),
    );
    expect(loop.renders()).toBe(1);
    expect(diagnostics).toMatchObject([{ name: "loop", source: "fallback", reason: "cycle" }]);
    expect(html).toMatch(/<section><assembly-root data-name="loop"[^>]* data-failed="[^"]+"/);
    // A view has nowhere to declare a fallback for what it places: the refused child is an
    // empty envelope, marked failed, its island the first thing in it.
    expect(html).toMatch(/ data-failed="[^"]+"><script type="application\/json"/);
  });

  it("refuses a cycle that runs through another assembly, at the hop that closes it", async () => {
    const ping = counted("ping", place("pong"));
    const pong = counted("pong", place("ping"));
    const { diagnostics } = await renderLocal(
      ping,
      "default",
      given({ fetch: server(ping, pong) }),
    );
    expect([ping.renders(), pong.renders()]).toEqual([1, 1]);
    expect(diagnostics[0]?.children).toMatchObject([{ name: "ping", reason: "cycle" }]);
  });

  it("refuses the child that would pass the depth cap, and none before it", async () => {
    const chain = [
      counted("c1", place("c2")),
      counted("c2", place("c3")),
      counted("c3", place("c4")),
    ];
    const last = counted("c4", "<p>too deep</p>");
    const [first] = chain;
    if (first === undefined) throw new Error("the chain is empty");
    // The cap is three: c1 arrives at one, c2 at two, c3 at three, and c4 would be the fourth.
    const { diagnostics } = await renderLocal(
      first,
      "default",
      given({ fetch: server(...chain, last), depth: 1 }),
    );
    expect([...chain, last].map((assembly) => assembly.renders())).toEqual([1, 1, 1, 0]);
    expect(diagnostics[0]?.children?.[0]?.children).toMatchObject([
      { name: "c4", source: "fallback", reason: "depth" },
    ]);
  });

  it("fails as a whole when its markup holds a directive that cannot be read", async () => {
    const careless = counted("careless", '<assembly name="hello">text</assembly>');
    await expect(renderLocal(careless, "default", given({ fetch: server(hello) }))).rejects.toThrow(
      /neither self-closing nor immediately closed/,
    );
  });

  it("stops dispatching once the request it belongs to has been aborted", async () => {
    const request = new AbortController();
    request.abort();
    const shell = counted("shell", place("hello"));
    const { diagnostics } = await renderLocal(
      shell,
      "default",
      given({ fetch: server(hello), signal: request.signal }),
    );
    expect(diagnostics).toMatchObject([{ name: "hello", source: "fallback", reason: "timeout" }]);
  });
});
