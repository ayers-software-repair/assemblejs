// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ApiContext } from "@assemblejs/core";

describe("what an api handler is given", () => {
  it("is the request's own query, params, body, headers and cookies", () => {
    const context: ApiContext = {
      query: new URLSearchParams("since=1"),
      params: { id: "7" },
      body: { name: "lamp" },
      headers: { host: "a.test" },
      cookies: { session: "s1" },
    };
    expect(Object.keys(context).sort()).toEqual(["body", "cookies", "headers", "params", "query"]);
  });

  it("has no body for a request that carried none", () => {
    const context: ApiContext = {
      query: new URLSearchParams(),
      params: {},
      body: undefined,
      headers: {},
      cookies: {},
    };
    expect(context.body).toBeUndefined();
  });
});
