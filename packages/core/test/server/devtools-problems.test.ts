// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createServer, devtoolsProblems } from "@assemblejs/core";
import type { DevtoolsRoute } from "@assemblejs/core";

const route = (path: string): DevtoolsRoute => ({
  method: "GET",
  path,
  respond: () => ({ type: "text/plain", body: "" }),
});

describe("what is checked about devtools routes before anything listens", () => {
  it("passes paths under the prefix, each once", () => {
    expect(devtoolsProblems({ routes: [route("/"), route("/a.css")] }, true)).toEqual([]);
  });

  it("refuses a path that would land beside the prefix, and one declared twice", () => {
    expect(devtoolsProblems({ routes: [route("x"), route("/a"), route("/a")] }, true)).toEqual([
      'devtools route "x" does not start with "/"',
      'devtools route "/a" is declared more than once',
    ]);
  });

  it("refuses the server's own reload paths", () => {
    expect(devtoolsProblems({ routes: [route("/reload"), route("/reload.js")] }, true)).toEqual([
      'devtools route "/reload" is the server\'s own',
      'devtools route "/reload.js" is the server\'s own',
    ]);
  });

  it("refuses a write where the routes are not mounted, so a project boots in both modes or neither", async () => {
    const post = { ...route("/run"), method: "POST" } as unknown as DevtoolsRoute;
    expect(devtoolsProblems({ routes: [post] }, true)).toEqual([]);
    // HEAD is a read in both modes, as the router's assertion reads it.
    const head = { ...route("/head"), method: "HEAD" } as unknown as DevtoolsRoute;
    expect(devtoolsProblems({ routes: [head] }, false)).toEqual([]);
    expect(devtoolsProblems({ routes: [post] }, false)).toEqual([
      'devtools route "/run" answers POST, and devtools only read',
    ]);
    await expect(
      createServer({
        config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
        assemblies: [],
        devtools: { routes: [post] },
        log: () => undefined,
      }),
    ).rejects.toThrow(/answers POST, and devtools only read/);
  });

  it("refuse the server that is handed them, before it listens", async () => {
    await expect(
      createServer({
        config: { mode: "development", host: "127.0.0.1", port: 0, auth: undefined },
        assemblies: [],
        devtools: { routes: [route("beside")] },
        log: () => undefined,
      }),
    ).rejects.toThrow(/devtools route "beside" does not start with "\/"/);
  });
});
