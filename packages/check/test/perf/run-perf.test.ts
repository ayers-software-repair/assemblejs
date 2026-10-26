// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { realIo } from "@asmjs/build";
import type { Io } from "@asmjs/build";
import { afterAll, describe, expect, it } from "vitest";
import { runPerf } from "@asmjs/check";

// Nested in an example, so the generated project resolves the workspace's packages as an
// installed one would.
const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const root = mkdtempSync(join(example, ".dev-perf-"));
const made = [root];
/** A directory for one test, removed with the rest when the file is done. */
const scratch = (prefix: string): string => {
  const at = mkdtempSync(join(tmpdir(), prefix));
  made.push(at);
  return at;
};
afterAll(() => {
  for (const at of made) rmSync(at, { recursive: true, force: true });
});

/** A project of one page on disk, for a run whose build and server are stood in for. */
const pagesOnly = (): string => {
  const at = scratch("pages-");
  realIo.write(join(at, "src", "pages", "home", "home.html"), "<p>home</p>");
  return at;
};

/** A server that answers every request with one document, but an address it guards. */
const stub = async (html: string, guarded = "") => {
  const asked: string[] = [];
  const server = createServer((request, response) => {
    asked.push(request.url ?? "");
    response.writeHead(request.url === guarded ? 401 : 200).end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    origin,
    asked,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

const capture = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};

/** One run of the verb over a project, its build stood in for, and how many servers it started. */
const runOnce = async (at: string, origin: string) => {
  const { io, errors } = capture();
  let started = 0;
  const code = await runPerf(at, io, {
    build: async () => 0,
    start: () => ((started += 1), { ready: Promise.resolve(origin), stop: async () => undefined }),
  });
  return { code, errors, started };
};

describe("the perf verb", { timeout: 60_000 }, () => {
  it("reports a page whose route has a parameter as not weighed, inventing no value for it", async () => {
    const { origin, close } = await stub("<p>page</p>");
    const at = pagesOnly();
    realIo.write(join(at, "src", "pages", "item", "item.html"), "<p>item</p>");
    realIo.write(
      join(at, "src", "pages", "item", "item.page.ts"),
      'export default { route: "/items/:sku" };\n',
    );
    realIo.write(join(at, "src", "pages", "not-found", "not-found.html"), "<p>gone</p>");
    const { io, logs, errors } = capture();
    const code = await runPerf(at, io, {
      build: async () => 0,
      start: () => ({ ready: Promise.resolve(origin), stop: async () => undefined }),
    });
    await close();
    expect(code).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toContain(
      '/items/:sku: not weighed, as a parameter needs a value; add "/items/:sku" to addresses in assemblejs.config.ts',
    );
    expect(logs).toContain("not-found: not weighed, as it has no address of its own");
    expect(logs.some((entry) => entry.startsWith("/  document"))).toBe(true);
  });

  it("weighs a page whose route has a parameter at the address the config gives it, and names both", async () => {
    const { origin, asked, close } = await stub("<p>page</p>");
    const at = pagesOnly();
    realIo.write(join(at, "src", "pages", "item", "item.html"), "<p>item</p>");
    realIo.write(
      join(at, "src", "pages", "item", "item.page.ts"),
      'export default { route: "/items/:sku" };\n',
    );
    realIo.write(
      join(at, "assemblejs.config.ts"),
      'export default { addresses: { "/items/:sku": "/items/kettle-1" } };\n',
    );
    const { io, logs, errors } = capture();
    const code = await runPerf(at, io, {
      build: async () => 0,
      start: () => ({ ready: Promise.resolve(origin), stop: async () => undefined }),
    });
    await close();
    expect(code).toBe(0);
    expect(errors).toEqual([]);
    expect(asked).toContain("/items/kettle-1");
    expect(asked).not.toContain("/items/:sku");
    expect(logs.some((entry) => entry.startsWith("/items/:sku (/items/kettle-1)  document"))).toBe(
      true,
    );
    expect(logs.some((entry) => entry.includes("not weighed, as a parameter"))).toBe(false);
  });

  it("holds the total to its budget, and refuses an address it cannot read before building", async () => {
    const { origin, close } = await stub(`<p>${"page ".repeat(40)}</p>`);
    const at = pagesOnly();
    const config = join(at, "assemblejs.config.ts");
    const run = () => runOnce(at, origin);
    realIo.write(config, "export default { budgets: { total: 10 } };\n");
    const over = await run();
    expect(over.code).toBe(1);
    expect(over.errors.join()).toMatch(
      /page "home": total is \d+ B gzipped, over its budget of 10 B/,
    );
    realIo.write(config, 'export default { addresses: { "/items/:sku": 5 } };\n');
    const unread = await run();
    expect(unread).toMatchObject({ code: 1, started: 0 });
    expect(unread.errors.join()).toMatch(
      /assemblejs.config.ts: the address for "\/items\/:sku" is not/,
    );
    await close();
  });

  it("reports a page a stranger is refused as not weighed, and does not fail for it", async () => {
    const { origin, close } = await stub("<p>page</p>", "/staff");
    const at = pagesOnly();
    realIo.write(join(at, "src", "pages", "staff", "staff.html"), "<p>staff</p>");
    const { io, logs, errors } = capture();
    const code = await runPerf(at, io, {
      build: async () => 0,
      start: () => ({ ready: Promise.resolve(origin), stop: async () => undefined }),
    });
    await close();
    expect(code).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toContain(
      "/staff: not weighed, as it is not shown to a visitor who has not signed in",
    );
    expect(logs.some((entry) => entry.startsWith("/  document"))).toBe(true);
  });

  it("holds each page to the budgets the config declares, and refuses a budget it cannot read before building", async () => {
    const { origin, close } = await stub(`<p>${"page ".repeat(40)}</p>`);
    const at = pagesOnly();
    const config = join(at, "assemblejs.config.ts");
    const run = () => runOnce(at, origin);
    realIo.write(config, "export default { budgets: { document: 10 } };\n");
    const over = await run();
    expect(over.code).toBe(1);
    expect(over.errors.join()).toMatch(
      /page "home": document is \d+ B gzipped, over its budget of 10 B/,
    );
    realIo.write(config, "export default { budgets: { document: 100000 } };\n");
    expect((await run()).code).toBe(0);
    for (const [budgets, said] of [
      ["{ fonts: 1 }", /assemblejs.config.ts: budgets names "fonts"/],
      ["{ document: 0 }", /the budget for document is not a whole number/],
      ["{ document: process.env.D }", /the budget for document is not written as a number/],
      ["shared", /budgets is not written as an object/],
    ] as const) {
      realIo.write(config, `export default { budgets: ${budgets} };\n`);
      const unread = await run();
      expect(unread, budgets).toMatchObject({ code: 1, started: 0 });
      expect(unread.errors.join(), budgets).toMatch(said);
    }
    realIo.write(config, "export default {\n");
    const broken = await run();
    expect(broken).toMatchObject({ code: 1, started: 0 });
    expect(broken.errors.join()).toMatch(/assemblejs.config.ts could not be read/);
    await close();
  });

  it("fails, and starts nothing, when the build does", async () => {
    const { io } = capture();
    expect(await runPerf(root, io, { build: async () => 1 })).toBe(1);
  });

  it("fails a page that answered an assembly with its fallback, and stops the server it started", async () => {
    const { origin, close } = await stub(
      '<p>page</p><assembly-root data-name="cart" data-failed="8f212c16"></assembly-root>',
    );
    let stops = 0;
    const { io, errors } = capture();
    const code = await runPerf(pagesOnly(), io, {
      build: async () => 0,
      start: () => ({ ready: Promise.resolve(origin), stop: async () => void (stops += 1) }),
    });
    await close();
    expect(code).toBe(1);
    expect(errors.join()).toMatch(/answered with the fallback of cart/);
    expect(stops).toBe(1);
  });

  it("stops the server and ends when it is interrupted", async () => {
    const controller = new AbortController();
    let stops = 0;
    // No pages at all, so nothing but the interruption itself can end the run.
    const code = runPerf(scratch("no-pages-"), capture().io, {
      build: async () => 0,
      start: () => ({
        ready: new Promise<string | undefined>(() => undefined),
        stop: async () => void (stops += 1),
      }),
      signal: controller.signal,
    });
    controller.abort();
    expect(await code).toBe(130);
    expect(stops).toBe(1);
  });

  it("ends at once when interrupted while a page is still answering", async () => {
    const server = createServer(() => undefined);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const controller = new AbortController();
    const code = runPerf(pagesOnly(), capture().io, {
      build: async () => 0,
      start: () => ({ ready: Promise.resolve(origin), stop: async () => undefined }),
      signal: controller.signal,
    });
    const started = Date.now();
    setTimeout(() => controller.abort(), 100);
    expect(await code).toBe(130);
    // At once, not when the request's own thirty seconds run out.
    expect(Date.now() - started).toBeLessThan(5_000);
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
