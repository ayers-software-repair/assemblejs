// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AccessPolicy } from "@assemblejs/core";

describe("what the one decision is made from", () => {
  it("is a control or none, and the routes that never need one", () => {
    const open: AccessPolicy = { basic: undefined, authenticate: undefined, publicRoutes: [] };
    expect(open.publicRoutes).toEqual([]);
  });
});
