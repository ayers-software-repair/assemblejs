// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it } from "vitest";
import { createServer, DEVTOOLS_ROUTE_PREFIX } from "@assemblejs/core";
import type { App, Devtools, DevtoolsView, LogLine } from "@assemblejs/core";

const seen: DevtoolsView[] = [];
const devtools: Devtools = {
  routes: [
    {
      method: "GET",
      path: "/",
      respond: (view) => {
        seen.push(view);
        return { type: "text/plain; charset=utf-8", body: `mode ${view.project.mode}` };
      },
    },
  ],
};
const broken = {
  name: "broken",
  views: {
    default: {
      renderer: "html",
      markup: () => {
        throw new Error("rendering broke");
      },
    },
  },
};

let server: App | undefined;
afterEach(async () => {
  await server?.close();
  server = undefined;
  seen.length = 0;
});

const start = async (mode: "development" | "production") => {
  const logged: LogLine[] = [];
  server = await createServer({
    config: { mode, host: "127.0.0.1", port: 0, auth: undefined },
    assemblies: [broken],
    devtools,
    log: (line) => logged.push(line),
  });
  return { server, logged };
};

describe("devtools, mounted", () => {
  it("answer under their prefix in development, never cached", async () => {
    const { server } = await start("development");
    const response = await server.inject({ method: "GET", url: `${DEVTOOLS_ROUTE_PREFIX}/` });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/plain; charset=utf-8");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toBe("mode development");
  });

  it("answer only a request addressed to this machine, not a site that rebound its name to it", async () => {
    const { server } = await start("development");
    const url = `${DEVTOOLS_ROUTE_PREFIX}/`;
    for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
      expect(
        (await server.inject({ method: "GET", url, headers: { host } })).statusCode,
        host,
      ).toBe(200);
    }
    expect(
      (await server.inject({ method: "GET", url, headers: { host: "evil.example" } })).statusCode,
    ).toBe(404);
    // Another machine saying Host: localhost to a server listening beyond loopback.
    const remote = {
      method: "GET",
      url,
      headers: { host: "localhost" },
      remoteAddress: "203.0.113.5",
    } as const;
    expect((await server.inject(remote)).statusCode).toBe(404);
    expect(seen).toHaveLength(3);
  });

  it("are not mounted at all in production", async () => {
    const { server } = await start("production");
    expect(
      (await server.inject({ method: "GET", url: `${DEVTOOLS_ROUTE_PREFIX}/` })).statusCode,
    ).toBe(404);
    expect(seen).toEqual([]);
  });

  it("are shown the failures the server logged, as it logged them", async () => {
    const { server, logged } = await start("development");
    await server.inject({ method: "GET", url: "/assembly/broken/" });
    await server.inject({ method: "GET", url: `${DEVTOOLS_ROUTE_PREFIX}/` });
    expect(logged).toHaveLength(1);
    expect(seen[0]?.failures()).toEqual(logged);
    expect(seen[0]?.project.assemblies.map((assembly) => assembly.name)).toEqual(["broken"]);
  });
});
