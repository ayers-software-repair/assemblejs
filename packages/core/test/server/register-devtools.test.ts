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
