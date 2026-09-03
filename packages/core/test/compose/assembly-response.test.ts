// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyResponse } from "@assemblejs/core";

describe("an assembly response", () => {
  it("discriminates on ok, and a failure always carries a correlation id", () => {
    const answered: AssemblyResponse = { ok: true, html: "<p>cart</p>", source: "remote" };
    const failed: AssemblyResponse = {
      ok: false,
      reason: "timeout",
      detail: "deadline of 500ms elapsed",
      correlationId: "c-1",
    };
    expect(answered.ok && answered.source).toBe("remote");
    // The id is the only thing a visitor is ever shown; the exception stays in the log.
    expect(failed.ok === false && failed.correlationId).toBe("c-1");
  });
});
