// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isPublicRoute } from "@assemblejs/core";

describe("a public route", () => {
  it("is an exact path, or anything under an entry ending in /*", () => {
    const routes = ["/health", "/docs/*"];
    expect(isPublicRoute("/health", routes)).toBe(true);
    expect(isPublicRoute("/docs/a/b", routes)).toBe(true);
    expect(isPublicRoute("/docs/", routes)).toBe(true);
  });

  it("is nothing that merely starts with the same letters, or differs in case", () => {
    const routes = ["/health", "/docs/*"];
    expect(isPublicRoute("/healthz", routes)).toBe(false);
    expect(isPublicRoute("/docsx", routes)).toBe(false);
    expect(isPublicRoute("/docs", routes)).toBe(false);
    expect(isPublicRoute("/HEALTH", routes)).toBe(false);
  });
});
