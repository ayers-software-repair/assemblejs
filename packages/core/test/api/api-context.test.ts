// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ApiContext } from "@assemblejs/core";

describe("what an api handler is given", () => {
  it("is the request's own query and params", () => {
    const context: ApiContext = { query: new URLSearchParams("since=1"), params: { id: "7" } };
    expect(Object.keys(context).sort()).toEqual(["params", "query"]);
  });
});
