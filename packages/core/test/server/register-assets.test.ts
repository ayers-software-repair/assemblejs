// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listAssets, registerAssets } from "@assemblejs/core";

const root = mkdtempSync(join(tmpdir(), "assets-"));
writeFileSync(join(root, "client-1a2b.js"), "export {};");
writeFileSync(join(root, "chunk.mjs"), "export {};");
writeFileSync(join(root, "s p.js"), "export {};");
writeFileSync(join(tmpdir(), "outside-secret.txt"), "hunter2");
const app = Fastify({ logger: false });

beforeAll(async () => {
  registerAssets(app, listAssets(root));
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe("serving a build's browser files", () => {
  it("answers a listed file with its type and a year of immutable caching", async () => {
    const response = await app.inject({ method: "GET", url: "/_assemblejs/assets/client-1a2b.js" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/javascript; charset=utf-8");
    expect(response.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(response.body).toBe("export {};");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("serves a listed file whatever query follows it, and a .mjs module as javascript", async () => {
    const cached = await app.inject({
      method: "GET",
      url: "/_assemblejs/assets/client-1a2b.js?v=2",
    });
    expect(cached.statusCode).toBe(200);
    const module = await app.inject({ method: "GET", url: "/_assemblejs/assets/chunk.mjs" });
    expect(module.headers["content-type"]).toBe("text/javascript; charset=utf-8");
  });

  it("answers a missing file with the failure body", async () => {
    const response = await app.inject({ method: "GET", url: "/_assemblejs/assets/missing.js" });
    expect(response.json()).toEqual({ error: { correlationId: expect.any(String) } });
  });

  it("serves a file whose name a browser percent-encodes", async () => {
    const response = await app.inject({ method: "GET", url: "/_assemblejs/assets/s%20p.js" });
    expect(response.statusCode).toBe(200);
  });

  it("is 404 for anything not listed at boot, including a path that tries to leave", async () => {
    for (const url of [
      "/_assemblejs/assets/missing.js",
      "/_assemblejs/assets/../outside-secret.txt",
      "/_assemblejs/assets/%2e%2e/outside-secret.txt",
    ]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode).toBe(404);
      expect(response.body).not.toContain("hunter2");
    }
  });
});
