// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { learnedManifests, parseContentUrl } from "@asmjs/core";
import type { LogLine } from "@asmjs/core";

// A server of manifests: each path answers the files named after it, and counts its reads.
const reads = new Map<string, number>();
let releaseChanging: () => void = () => undefined;
const changingReleased = new Promise<void>((resolve) => {
  releaseChanging = resolve;
});
let markChangingStarted: () => void = () => undefined;
const changingStarted = new Promise<void>((resolve) => {
  markChangingStarted = resolve;
});
const server = createHttpServer((request, response) => {
  const path = request.url ?? "";
  const count = (reads.get(path) ?? 0) + 1;
  reads.set(path, count);
  if (path.includes("/broken/")) {
    response.writeHead(500);
    response.end();
    return;
  }
  const name = /\/assembly\/([a-z]+)\//.exec(path)?.[1] ?? "none";
  const answer = () => {
    const suffix = name === "changing" ? String(count) : "";
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({ assets: { css: [`/${name}${suffix}.css`], js: [`/${name}${suffix}.js`] } }),
    );
  };
  if (name === "changing" && count === 1) {
    markChangingStarted();
    void changingReleased.then(answer);
  } else {
    answer();
  }
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
    learned.learn(content("cart"), manifest("cart"), origin, "v1", []);
    // A read still in flight is waited for.
    expect(await learned.assets(content("cart"))).toEqual({
      css: [`${origin}/cart.css`],
      js: [`${origin}/cart.js`],
    });
  });

  it("is read once per version, however many answers that version sends", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    for (const version of ["v1", "v1", "v1"]) {
      learned.learn(content("once"), manifest("once"), origin, version, []);
      await learned.assets(content("once"));
    }
    expect(readsOf("once")).toBe(1);
    learned.learn(content("once"), manifest("once"), origin, "v2", []);
    await learned.assets(content("once"));
    expect(readsOf("once")).toBe(2);
  });

  it("is asked for once by first requests that arrive together", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    for (let i = 0; i < 5; i += 1)
      learned.learn(content("rush"), manifest("rush"), origin, "v1", []);
    await learned.assets(content("rush"));
    expect(readsOf("rush")).toBe(1);
  });

  it("reads a new version while the previous version is still being read", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined, reads: 1 });
    learned.learn(content("changing"), manifest("changing"), origin, "v1", []);
    await changingStarted;
    for (let request = 0; request < 3; request += 1) {
      learned.learn(content("changing"), manifest("changing"), origin, "v2", []);
    }
    releaseChanging();
    expect(await learned.assets(content("changing"))).toEqual({
      css: [`${origin}/changing2.css`],
      js: [`${origin}/changing2.js`],
    });
    expect(readsOf("changing")).toBe(2);
  });

  it("returns to a cached version when the content rolls back during another read", async () => {
    let releaseV2: () => void = () => undefined;
    const v2Released = new Promise<void>((resolve) => {
      releaseV2 = resolve;
    });
    let markV2Started: () => void = () => undefined;
    const v2Started = new Promise<void>((resolve) => {
      markV2Started = resolve;
    });
    let read = 0;
    const fetched = vi.fn(async () => {
      await Promise.resolve();
      read += 1;
      if (read === 2) {
        markV2Started();
        await v2Released;
      }
      const version = read === 2 ? "v2" : "v1";
      return new Response(JSON.stringify({ assets: { css: [`/${version}.css`], js: [] } }), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetched);
    try {
      const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
      learned.learn(content("rollback"), manifest("rollback"), origin, "v1", []);
      expect((await learned.assets(content("rollback")))?.css).toEqual([`${origin}/v1.css`]);
      learned.learn(content("rollback"), manifest("rollback"), origin, "v2", []);
      await v2Started;
      learned.learn(content("rollback"), manifest("rollback"), origin, "v1", []);
      releaseV2();
      expect((await learned.assets(content("rollback")))?.css).toEqual([`${origin}/v1.css`]);
      expect(fetched).toHaveBeenCalledTimes(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("bounds every version read by one shared deadline and can read again afterward", async () => {
    let now = 0;
    const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    let read = 0;
    const fetched = vi.fn(async () => {
      await Promise.resolve();
      read += 1;
      now += 500;
      if (read < 3) {
        learned.learn(content("budget"), manifest("budget"), origin, `v${String(read + 1)}`, []);
      }
      return new Response(
        JSON.stringify({ assets: { css: [`/budget${String(read)}.css`], js: [] } }),
        { headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetched);
    try {
      learned.learn(content("budget"), manifest("budget"), origin, "v1", []);
      expect(await learned.assets(content("budget"))).toEqual({
        css: [`${origin}/budget2.css`],
        js: [],
      });
      expect(fetched).toHaveBeenCalledTimes(2);
      expect(timeout).toHaveBeenNthCalledWith(1, 1000);
      expect(timeout).toHaveBeenNthCalledWith(2, 500);

      learned.learn(content("budget"), manifest("budget"), origin, "v4", []);
      expect(await learned.assets(content("budget"))).toEqual({
        css: [`${origin}/budget3.css`],
        js: [],
      });
      expect(fetched).toHaveBeenCalledTimes(3);
    } finally {
      vi.unstubAllGlobals();
      timeout.mockRestore();
      clock.mockRestore();
    }
  });

  it("is a logged warning and a retry when it cannot be read, never an answer", async () => {
    const logged: LogLine[] = [];
    const learned = learnedManifests({ maxBytes: 4096, log: (line) => logged.push(line) });
    learned.learn(content("broken"), manifest("broken"), origin, "v1", []);
    expect(await learned.assets(content("broken"))).toBeUndefined();
    expect(logged[0]?.message).toMatch(/could not be read, and will be asked for again/);
    learned.learn(content("broken"), manifest("broken"), origin, "v1", []);
    await learned.assets(content("broken"));
    expect(readsOf("broken")).toBe(2);
  });
});

describe("what an answer held inside it", () => {
  const child = (name: string) => {
    const url = parseContentUrl(`${origin}/assembly/${name}/default/`);
    if (url === undefined) throw new Error(`not a content url: ${name}`);
    return url;
  };
  const files = (...names: string[]) => ({
    css: names.map((name) => `${origin}/${name}.css`),
    js: names.map((name) => `${origin}/${name}.js`),
  });

  it("has its manifest read by the same rule, and its files linked with the answer's own", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    for (let request = 0; request < 3; request += 1) {
      learned.learn(content("shell"), manifest("shell"), origin, "v1", [
        child("price"),
        child("tag"),
      ]);
      expect(await learned.assets(content("shell"))).toEqual(files("shell", "price", "tag"));
    }
    expect([readsOf("shell"), readsOf("price"), readsOf("tag")]).toEqual([1, 1, 1]);
  });

  it("is kept for as long as the version stands, whichever answer held it", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined });
    // Two requests whose answers held different children: a page served from the cache holds
    // one of them, and nothing says which, so both stay linked.
    learned.learn(content("frame"), manifest("frame"), origin, "v1", [child("left")]);
    learned.learn(content("frame"), manifest("frame"), origin, "v1", [child("right")]);
    expect(await learned.assets(content("frame"))).toEqual(files("frame", "left", "right"));
    // A new version of the server's output is a new account of what its answers hold.
    learned.learn(content("frame"), manifest("frame"), origin, "v2", []);
    expect(await learned.assets(content("frame"))).toEqual(files("frame"));
  });

  it("does not hold back the files that were read when a child's manifest cannot be", async () => {
    const logged: LogLine[] = [];
    const learned = learnedManifests({ maxBytes: 4096, log: (line) => logged.push(line) });
    learned.learn(content("panel"), manifest("panel"), origin, "v1", [child("broken")]);
    expect(await learned.assets(content("panel"))).toEqual(files("panel"));
    expect(logged[0]?.message).toMatch(/broken\/default\/manifest\/ could not be read/);
  });
});

// Which assemblies an answer holds is the other server's to say, and it may name new ones with
// every answer: three thousand in one answer started a read for every one at once.
describe("what another server's answers can make this one ask for and keep", () => {
  const name = (prefix: string, n: number) => `${prefix}${"abcdefghij"[n] ?? "z"}`;
  const children = (prefix: string, count: number) =>
    Array.from({ length: count }, (_, n) => {
      const url = parseContentUrl(`${origin}/assembly/${name(prefix, n)}/default/`);
      if (url === undefined) throw new Error("not a content url");
      return url;
    });

  it("has no more reads in flight than its bound, says so once, and asks for the rest when next seen", async () => {
    const logged: LogLine[] = [];
    const learned = learnedManifests({
      maxBytes: 4096,
      log: (line) => logged.push(line),
      reads: 3,
    });
    learned.learn(content("crowd"), manifest("crowd"), origin, "v1", children("crowd", 6));
    await learned.assets(content("crowd"));
    const read = () => Array.from({ length: 6 }, (_, n) => readsOf(name("crowd", n)));
    // The answer's own, and the first two it held.
    expect([readsOf("crowd"), ...read()]).toEqual([1, 1, 1, 0, 0, 0, 0]);
    expect(logged.map((line) => line.message)).toEqual([
      expect.stringMatching(
        /^3 remote manifests are being read at once, the most this server reads/,
      ),
    ]);
    learned.learn(content("crowd"), manifest("crowd"), origin, "v1", children("crowd", 6));
    await learned.assets(content("crowd"));
    expect(read()).toEqual([1, 1, 1, 1, 1, 0]);
  });

  it("keeps no more manifests than its bound: the oldest is let go, and read again when seen again", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined, kept: 3 });
    for (const [n, held] of children("keep", 5).entries()) {
      learned.learn(held.content, held.manifest, origin, "v1", []);
      await learned.assets(held.content);
      expect(readsOf(name("keep", n))).toBe(1);
    }
    const [first, , , , last] = children("keep", 5);
    if (first === undefined || last === undefined) throw new Error("no children");
    learned.learn(last.content, last.manifest, origin, "v1", []);
    learned.learn(first.content, first.manifest, origin, "v1", []);
    await learned.assets(first.content);
    expect([readsOf(name("keep", 4)), readsOf(name("keep", 0))]).toEqual([1, 2]);
  });

  it("remembers no more of what one url's answers held than its bound, the newest of them", async () => {
    const learned = learnedManifests({ maxBytes: 4096, log: () => undefined, held: 2 });
    for (const held of children("held", 4)) {
      learned.learn(content("frame"), manifest("frame"), origin, "v9", [held]);
    }
    const files = ["frame", name("held", 2), name("held", 3)];
    expect(await learned.assets(content("frame"))).toEqual({
      css: files.map((file) => `${origin}/${file}.css`),
      js: files.map((file) => `${origin}/${file}.js`),
    });
  });
});
