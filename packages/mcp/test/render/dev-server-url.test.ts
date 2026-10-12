// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { devServerUrl, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

let root: ProjectRoot;
let dir = "";
let origin = "";
// A server that answers health as the framework's does, and nothing else.
const server = createServer((request, response) => {
  if (request.url === "/_assemblejs/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"status":"ok","version":"v"}');
  } else {
    response.writeHead(404);
    response.end();
  }
});
const record = (contents: string): void => {
  mkdirSync(join(dir, ".assemblejs"), { recursive: true });
  writeFileSync(join(dir, ".assemblejs", "dev.json"), contents);
};

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-dev-"));
  mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
  root = resolveRoot(dir);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("finding the project's dev server", () => {
  it("is nothing when dev left no record", async () => {
    expect(await devServerUrl(root)).toBeUndefined();
  });

  // The guard refuses such a path by throwing, and the throw ended every tool that asks for a
  // dev server: a record this project's own guard will not read is no record.
  it("is nothing for a record that is a link out of the project, or a link to nothing", async () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-outside-"));
    writeFileSync(join(outside, "dev.json"), JSON.stringify({ url: origin }));
    mkdirSync(join(dir, ".assemblejs"), { recursive: true });
    symlinkSync(join(outside, "dev.json"), join(dir, ".assemblejs", "dev.json"));
    expect(await devServerUrl(root)).toBeUndefined();
    rmSync(join(dir, ".assemblejs", "dev.json"));
    symlinkSync(join(outside, "no-such-record.json"), join(dir, ".assemblejs", "dev.json"));
    expect(await devServerUrl(root)).toBeUndefined();
    rmSync(outside, { recursive: true, force: true });
  });

  it("is the recorded url once that server answers its health", async () => {
    record(`${JSON.stringify({ url: origin })}\n`);
    expect(await devServerUrl(root)).toBe(origin);
  });

  it("is nothing for a record a dead dev left behind, a server that is not one, or no record at all", async () => {
    record(JSON.stringify({ url: "http://127.0.0.1:9" }));
    expect(await devServerUrl(root)).toBeUndefined();
    // A server that answers, but not with the framework's health: not the project's.
    record(JSON.stringify({ url: `${origin}/elsewhere` }));
    expect(await devServerUrl(root)).toBeUndefined();
    record("not json");
    expect(await devServerUrl(root)).toBeUndefined();
    record(JSON.stringify({ port: 3000 }));
    expect(await devServerUrl(root)).toBeUndefined();
  });

  // The record is a file under the project, and whatever wrote it, the address in it is asked
  // for from the developer's machine. A dev server listens on this machine and nowhere else.
  it("is nothing for a record that names any address but this machine's own", async () => {
    for (const url of [
      "http://192.0.2.1:3000",
      "http://example.com",
      "https://127.0.0.1.example.com:3000",
      "file:///etc/hosts",
      "not a url",
    ]) {
      record(JSON.stringify({ url }));
      const started = performance.now();
      expect(await devServerUrl(root), url).toBeUndefined();
      // Not asked and timed out: not asked.
      expect(performance.now() - started, url).toBeLessThan(500);
    }
  });

  it("is the url for this machine by any of its own names", async () => {
    const port = origin.split(":").at(-1) ?? "";
    record(JSON.stringify({ url: `http://localhost:${port}` }));
    expect(await devServerUrl(root)).toBe(`http://localhost:${port}`);
  });

  // A dev server told to listen on one of the machine's own addresses is this machine's too: it
  // is asked there, as one on loopback is. Held to loopback alone, it was not seen.
  it("is the url for an address of one of this machine's own interfaces", async () => {
    const own = Object.values(networkInterfaces())
      .flat()
      .find((one) => one !== undefined && !one.internal && one.family === "IPv4")?.address;
    // A machine with no interface but loopback has no such address to ask.
    if (own === undefined) return;
    const everywhere = createServer((request, response) => {
      response.writeHead(request.url === "/_assemblejs/health" ? 200 : 404, {
        "content-type": "application/json",
      });
      response.end('{"status":"ok","version":"v"}');
    });
    await new Promise<void>((resolve) => everywhere.listen(0, "0.0.0.0", resolve));
    const url = `http://${own}:${String((everywhere.address() as AddressInfo).port)}`;
    record(JSON.stringify({ url }));
    expect(await devServerUrl(root)).toBe(url);
    await new Promise<void>((resolve) => everywhere.close(() => resolve()));
  });

  // An address another program took after a dev server died may answer 200 for any path at all.
  it("is nothing for a server that answers its health with anything but the framework's own", async () => {
    const other = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<html><body>another app, which answers every path</body></html>");
    });
    await new Promise<void>((resolve) => other.listen(0, "127.0.0.1", resolve));
    record(
      JSON.stringify({ url: `http://127.0.0.1:${String((other.address() as AddressInfo).port)}` }),
    );
    expect(await devServerUrl(root)).toBeUndefined();
    await new Promise<void>((resolve) => other.close(() => resolve()));
  });
});
