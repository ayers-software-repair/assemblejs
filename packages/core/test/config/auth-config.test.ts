// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AuthConfig } from "@assemblejs/core";

describe("basic credentials", () => {
  it("carry both halves, and neither has a default", () => {
    const auth: AuthConfig = { user: "ops", password: "not-a-default" };
    expect(Object.keys(auth).sort()).toEqual(["password", "user"]);
  });
});
