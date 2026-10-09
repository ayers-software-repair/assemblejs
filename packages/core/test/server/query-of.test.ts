// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { queryOf } from "@assemblejs/core";

describe("reading a request's query", () => {
  it("parses what follows the first question mark", () => {
    expect(queryOf("/api/items?page=3&q=a%3Fb").get("q")).toBe("a?b");
    expect(queryOf("/api/items?page=3").get("page")).toBe("3");
  });

  it("is empty for a url without one", () => {
    expect([...queryOf("/api/items").keys()]).toEqual([]);
  });
});
