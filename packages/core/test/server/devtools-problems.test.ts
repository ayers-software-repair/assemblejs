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
    expect(devtoolsProblems({ routes: [route("/"), route("/a.css")] })).toEqual([]);
  });

  it("refuses a path that would land beside the prefix, and one declared twice", () => {
    expect(devtoolsProblems({ routes: [route("x"), route("/a"), route("/a")] })).toEqual([
      'devtools route "x" does not start with "/"',
      'devtools route "/a" is declared more than once',
    ]);
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
