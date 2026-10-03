// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { writeLogLine } from "@assemblejs/core";

describe("the default log", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes one JSON object per line to standard error", () => {
    const written: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      written.push(String(chunk));
      return true;
    });
    writeLogLine({ correlationId: "a7f3", message: "refused", stack: undefined });
    expect(written).toHaveLength(1);
    expect(written[0]?.endsWith("\n")).toBe(true);
    expect(JSON.parse(written[0] ?? "")).toEqual({
      level: "error",
      correlationId: "a7f3",
      message: "refused",
    });
  });
});
