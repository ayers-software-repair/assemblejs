// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { resolveRoot } from "@assemblejs/mcp";

describe("resolving the project root", () => {
  it("makes it absolute, so every later comparison is against a real path", () => {
    expect(resolveRoot(".").path.startsWith("/")).toBe(true);
    expect(resolveRoot("/tmp/x/..").path).toBe("/tmp");
  });
});
