// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Environment } from "@assemblejs/core";

describe("the environment", () => {
  it("is a value, which is what makes reading configuration a pure function", () => {
    const environment: Environment = { ASSEMBLEJS_PORT: "8080", ASSEMBLEJS_MISSING: undefined };
    expect(environment["ASSEMBLEJS_PORT"]).toBe("8080");
    expect(environment["ASSEMBLEJS_MISSING"]).toBeUndefined();
  });
});
