// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AccessRequest } from "@assemblejs/core";

describe("what the access decision is given", () => {
  it("is the method, the path without its query, and the headers", () => {
    const request: AccessRequest = { method: "GET", path: "/", headers: {} };
    expect(Object.keys(request).sort()).toEqual(["headers", "method", "path"]);
  });
});
