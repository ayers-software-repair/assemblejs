// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { describeFailure, renderFailure } from "@assemblejs/core";

describe("describing a failure for the log", () => {
  it("keeps the message and the stack, which the visitor never sees", () => {
    const cause = new Error("connection to postgres://user:pw@host refused");
    const line = describeFailure("a7f3c1d0", cause);
    expect(line.message).toContain("postgres://user:pw@host");
    expect(line.stack).toContain("describe-failure.test");

    // The same id, and none of that, in what the visitor is handed.
    const body = JSON.stringify(renderFailure(line.correlationId));
    expect(body).toContain("a7f3c1d0");
    expect(body).not.toContain("postgres");
  });

  it("handles something thrown that is not an Error", () => {
    const line = describeFailure("a7f3c1d0", "a bare string");
    expect(line.message).toBe("a bare string");
    expect(line.stack).toBeUndefined();
  });
});
