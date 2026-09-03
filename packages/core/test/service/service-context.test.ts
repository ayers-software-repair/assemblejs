// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ServiceContext } from "@assemblejs/core";

describe("what a service is given", () => {
  it("is its own request and nothing of any other assembly's", () => {
    const context: ServiceContext = { query: new URLSearchParams("name=ada"), params: {} };
    expect(Object.keys(context).sort()).toEqual(["params", "query"]);
  });
});
