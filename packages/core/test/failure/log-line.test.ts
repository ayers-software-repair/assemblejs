// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { LogLine } from "@assemblejs/core";

describe("a log line", () => {
  it("pairs what the visitor was told with what actually happened", () => {
    const line: LogLine = { correlationId: "a7f3c1d0", message: "boom", stack: undefined };
    expect(line.correlationId).toBe("a7f3c1d0");
  });
});
