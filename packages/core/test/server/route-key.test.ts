// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { routeKey } from "@assemblejs/core";

describe("what the router matches", () => {
  it("treats paths that differ only in a parameter's name as one route", () => {
    expect(routeKey("GET", "/items/:id")).toBe(routeKey("GET", "/items/:key"));
  });

  it("keeps the method and the literal segments apart", () => {
    expect(routeKey("GET", "/items/:id")).not.toBe(routeKey("POST", "/items/:id"));
    expect(routeKey("GET", "/items/:id")).not.toBe(routeKey("GET", "/things/:id"));
  });
});
