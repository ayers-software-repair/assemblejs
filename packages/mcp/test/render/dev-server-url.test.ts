// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
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
});
