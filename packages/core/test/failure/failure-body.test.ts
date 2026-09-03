// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { FailureBody } from "@assemblejs/core";

describe("the body a failed request answers with", () => {
  it("has one field, and no place to put a message", () => {
    const body: FailureBody = { error: { correlationId: "a7f3c1d0" } };
    expect(Object.keys(body.error)).toEqual(["correlationId"]);
  });
});
