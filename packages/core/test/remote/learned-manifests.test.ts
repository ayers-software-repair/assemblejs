// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { learnedManifests } from "@assemblejs/core";
import type { LogLine } from "@assemblejs/core";

// A server of manifests: each path answers the files named after it, and counts its reads.
const reads = new Map<string, number>();
const server = createHttpServer((request, response) => {
  const path = request.url ?? "";
  reads.set(path, (reads.get(path) ?? 0) + 1);
  if (path.includes("/broken/")) {
    response.writeHead(500);
    response.end();
    return;
  }
  const name = /\/assembly\/([a-z]+)\//.exec(path)?.[1] ?? "none";
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ assets: { css: [`/${name}.css`], js: [`/${name}.js`] } }));
});
let origin = "";
const content = (name: string): string => `${origin}/assembly/${name}/`;
const manifest = (name: string): string => `${origin}/assembly/${name}/default/manifest/`;
const readsOf = (name: string): number => reads.get(`/assembly/${name}/default/manifest/`) ?? 0;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
});
afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("what other servers' manifests declared", () => {
  it("is read when an assembly's version is first seen, and its files made absolute", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    expect(await learned.assets(content("cart"))).toBeUndefined();
    learned.learn(content("cart"), manifest("cart"), origin, "v1");
    // A read still in flight is waited for.
    expect(await learned.assets(content("cart"))).toEqual({
      css: [`${origin}/cart.css`],
      js: [`${origin}/cart.js`],
    });
  });

  it("is read once per version, however many answers that version sends", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    for (const version of ["v1", "v1", "v1"]) {
      learned.learn(content("once"), manifest("once"), origin, version);
      await learned.assets(content("once"));
    }
    expect(readsOf("once")).toBe(1);
    learned.learn(content("once"), manifest("once"), origin, "v2");
    await learned.assets(content("once"));
    expect(readsOf("once")).toBe(2);
  });

  it("is asked for once by first requests that arrive together", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    for (let i = 0; i < 5; i += 1) learned.learn(content("rush"), manifest("rush"), origin, "v1");
    await learned.assets(content("rush"));
    expect(readsOf("rush")).toBe(1);
  });

  it("is a logged warning and a retry when it cannot be read, never an answer", async () => {
    const logged: LogLine[] = [];
    const learned = learnedManifests({ maxBytes: 4096, log: (line) => logged.push(line) });
    learned.learn(content("broken"), manifest("broken"), origin, "v1");
    expect(await learned.assets(content("broken"))).toBeUndefined();
    expect(logged[0]?.message).toMatch(/could not be read, and will be asked for again/);
    learned.learn(content("broken"), manifest("broken"), origin, "v1");
    await learned.assets(content("broken"));
    expect(readsOf("broken")).toBe(2);
  });
});
