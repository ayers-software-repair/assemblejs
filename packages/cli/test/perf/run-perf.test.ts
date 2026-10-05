// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { projectFiles, realIo, runPerf } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

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

/** A server that answers every request with one document. */
const stub = async (html: string) => {
  const server = createServer((_request, response) => response.writeHead(200).end(html));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { origin, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
};

const capture = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};

describe("the perf verb", { timeout: 60_000 }, () => {
  it("builds, runs the build in production, and weighs each page from it", async () => {
    for (const [path, contents] of Object.entries(projectFiles("weighed"))) {
      realIo.write(join(root, path), contents);
    }
    realIo.write(join(root, "src", "assemblies", "hello", "hello.css"), ".hi { color: red }\n");
    // A page at the route its own file declares, not the one its directory implies.
    realIo.write(
      join(root, "src", "pages", "shop", "shop.html"),
      '<body><assembly name="hello"></assembly></body>',
    );
    realIo.write(
      join(root, "src", "pages", "shop", "shop.page.ts"),
      'import { definePage } from "@assemblejs/core";\nexport default definePage({ route: "/store" });\n',
    );
    const { io, logs, errors } = capture();
    expect(await runPerf(root, io)).toBe(0);
    expect(errors).toEqual([]);
    const line = logs.find((entry) => entry.startsWith("/  document"));
    expect(logs.some((entry) => entry.startsWith("/store  document"))).toBe(true);
    expect(line).toMatch(
      /^\/ {2}document \d+ B \(\d+ B gzip\) {2}styles [1-9]\d* B \(\d+ B gzip\) {2}scripts 0 B \(0 B gzip\)$/,
    );
  });

  it("reports a page whose route has a parameter as not weighed, inventing no value for it", async () => {
    const { origin, close } = await stub("<p>page</p>");
    const at = pagesOnly();
    realIo.write(join(at, "src", "pages", "item", "item.html"), "<p>item</p>");
    realIo.write(
      join(at, "src", "pages", "item", "item.page.ts"),
      'export default { route: "/items/:sku" };\n',
    );
    const { io, logs, errors } = capture();
    const code = await runPerf(at, io, {
      build: async () => 0,
      start: () => ({ ready: Promise.resolve(origin), stop: async () => undefined }),
    });
    await close();
    expect(code).toBe(0);
    expect(errors).toEqual([]);
    expect(logs).toContain("/items/:sku: not weighed, as a parameter needs a value");
    expect(logs.some((entry) => entry.startsWith("/  document"))).toBe(true);
  });

  it("holds each page to the budgets the config declares, and refuses a budget it cannot read before building", async () => {
    const { origin, close } = await stub(`<p>${"page ".repeat(40)}</p>`);
    const at = pagesOnly();
    const config = join(at, "assemblejs.config.ts");
    const run = async () => {
      const { io, errors } = capture();
      let started = 0;
      const code = await runPerf(at, io, {
        build: async () => 0,
        start: () => (
          (started += 1),
          { ready: Promise.resolve(origin), stop: async () => undefined }
        ),
      });
      return { code, errors, started };
    };
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
      ["{ document: process.env.D }", /the budget for document is computed/],
      ["shared", /budgets is computed/],
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
