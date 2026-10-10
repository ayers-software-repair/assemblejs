// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createServer, defineAssembly } from "@assemblejs/core";
import type { ServerOptions } from "@assemblejs/core";

describe("what a server is built from", () => {
  it("needs a configuration and its assemblies, and defaults the rest", () => {
    const options: ServerOptions = {
      config: { mode: "production", host: "127.0.0.1", port: 3000, auth: undefined },
      assemblies: [],
    };
    expect(options.version).toBeUndefined();
    expect(options.maxDepth).toBeUndefined();
    expect(options.apis).toBeUndefined();
    expect(options.pages).toBeUndefined();
    expect(options.assets).toBeUndefined();
  });

  it("may leave the configuration to the process environment", () => {
    const options: ServerOptions = { assemblies: [] };
    expect(options.config).toBeUndefined();
  });
});

describe("the depth a server composes to", () => {
  // a places b, b places c: three assemblies deep from a page that places a.
  const link = (name: string, child?: string) =>
    defineAssembly({
      name,
      views: {
        default: {
          renderer: "html",
          markup: () =>
            child === undefined ? `<p>${name}</p>` : `<assembly name="${child}"></assembly>`,
        },
      },
    });
  const refusedAt = async (maxDepth: number): Promise<string[]> => {
    const server = await createServer({
      config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
      assemblies: [link("a", "b"), link("b", "c"), link("c")],
      pages: [{ route: "/", template: '<body><assembly name="a"></assembly></body>' }],
      maxDepth,
      log: () => undefined,
    });
    const page = (await server.inject({ method: "GET", url: "/" })).body;
    await server.close();
    return [...page.matchAll(/data-name="([a-z])"[^>]* data-failed=/g)].map(
      (found) => found[1] ?? "",
    );
  };

  it("is one cap: the page's composer and every view's composer refuse at the same depth", async () => {
    expect(await refusedAt(8)).toEqual([]);
    // a arrives at one and b at two; c would be the third.
    expect(await refusedAt(2)).toEqual(["c"]);
    expect(await refusedAt(1)).toEqual(["b"]);
    // At zero nothing may be placed at all, and it is the page's own composer that says so.
    expect(await refusedAt(0)).toEqual(["a"]);
  });
});
