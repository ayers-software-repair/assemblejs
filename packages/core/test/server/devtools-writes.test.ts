// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { BootError, createServer, DEVTOOLS_ROUTE_PREFIX, devtoolsWrites } from "@assemblejs/core";
import type { DevtoolsRoute } from "@assemblejs/core";

const answer = () => ({ type: "text/plain", body: "" });

describe("routes that write under the devtools prefix", () => {
  it("are found whoever mounts them, and reads are not", async () => {
    const app = Fastify({ logger: false });
    const writes = devtoolsWrites(app);
    app.get(`${DEVTOOLS_ROUTE_PREFIX}/read`, answer);
    app.post(`${DEVTOOLS_ROUTE_PREFIX}/run`, answer);
    app.route({ method: ["GET", "DELETE"], url: `${DEVTOOLS_ROUTE_PREFIX}/both`, handler: answer });
    app.post("/api/elsewhere", answer);
    await app.close();
    expect(writes()).toEqual([
      `POST "${DEVTOOLS_ROUTE_PREFIX}/run" is under the devtools prefix, where nothing may write`,
      `DELETE "${DEVTOOLS_ROUTE_PREFIX}/both" is under the devtools prefix, where nothing may write`,
    ]);
  });

  it("include one a plugin mounts, which is seen once the router is ready", async () => {
    const app = Fastify({ logger: false });
    const writes = devtoolsWrites(app);
    await app.register(async (scope) => void scope.post("/run", answer), {
      prefix: DEVTOOLS_ROUTE_PREFIX,
    });
    await app.ready();
    await app.close();
    expect(writes()).toEqual([
      `POST "${DEVTOOLS_ROUTE_PREFIX}/run" is under the devtools prefix, where nothing may write`,
    ]);
  });

  // B-19's proof: a POST registered under the prefix, and boot refusing.
  it("refuse the server before it listens", async () => {
    const run = { method: "POST", path: "/run", respond: answer } as unknown as DevtoolsRoute;
    const booting = createServer({
      config: { mode: "development", host: "127.0.0.1", port: 0, auth: undefined },
      assemblies: [],
      devtools: { routes: [run] },
      log: () => undefined,
    });
    await expect(booting).rejects.toThrow(BootError);
    await expect(booting).rejects.toThrow(/POST ".*\/devtools\/run" is under the devtools prefix/);
  });
});
