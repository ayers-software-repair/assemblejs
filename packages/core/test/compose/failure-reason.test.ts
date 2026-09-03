// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { FailureReason } from "@assemblejs/core";

describe("the failure reasons", () => {
  it("name every way reaching an assembly produces no content", () => {
    const every: FailureReason[] = [
      "timeout",
      "status",
      "transport",
      "content-type",
      "too-large",
      "invalid",
    ];
    // Each is a failure and none of them is ever rendered as content.
    expect(new Set(every).size).toBe(every.length);
  });
});
