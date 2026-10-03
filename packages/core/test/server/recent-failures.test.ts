// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { recentFailures } from "@assemblejs/core";

const line = (n: number) => ({ correlationId: String(n), message: "m", stack: undefined });

describe("the failures a process logged most recently", () => {
  it("keeps the latest ones, oldest first, dropping the oldest past the limit", () => {
    const failures = recentFailures(2);
    expect(failures.list()).toEqual([]);
    for (const n of [1, 2, 3]) failures.record(line(n));
    expect(failures.list().map((entry) => entry.correlationId)).toEqual(["2", "3"]);
  });

  it("answers a copy, which a reader cannot change", () => {
    const failures = recentFailures();
    failures.record(line(1));
    (failures.list() as unknown as unknown[]).length = 0;
    expect(failures.list()).toHaveLength(1);
  });
});
